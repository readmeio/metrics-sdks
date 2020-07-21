<?php
namespace ReadMe;

use Closure;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\CurlMultiHandler;
use GuzzleHttp\HandlerStack;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use PackageVersions\Versions;
use Ramsey\Uuid\Uuid;
use Symfony\Component\HttpFoundation\HeaderBag;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\MimeTypes;

class Metrics
{
    const PACKAGE_NAME = 'readme/metrics';
    const METRICS_API = 'https://metrics.readme.io';

    /** @var string */
    private $api_key;

    /** @var bool */
    private $development_mode = false;

    /** @var array */
    private $blacklist = [];

    /** @var array */
    private $whitelist = [];

    /** @var class-string */
    private $group_handler;

    /** @var CurlMultiHandler */
    private $curl_handler;

    /** @var Client */
    private $client;

    /** @var string */
    private $package_version;

    /**
     * @param string $api_key
     * @param class-string $group_handler
     * @param array $options
     */
    public function __construct(string $api_key, string $group_handler, array $options = [])
    {
        $this->api_key = $api_key;
        $this->group_handler = $group_handler;
        $this->development_mode = array_key_exists('development_mode', $options)
            ? (bool)$options['development_mode']
            : false;

        if (isset($options['blacklist']) && is_array($options['blacklist'])) {
            $this->blacklist = $options['blacklist'];
        }

        if (isset($options['whitelist']) && is_array($options['whitelist'])) {
            $this->whitelist = $options['whitelist'];
        }

        $this->curl_handler = new CurlMultiHandler();
        $this->client = (isset($options['client'])) ? $options['client'] : new Client([
            'handler' => HandlerStack::create($this->curl_handler),

            'base_uri' => self::METRICS_API,

            // In development mode, requests are sent asynchronously (as well as PHP can without directly invoking
            // shell cURL commands), so a very small timeout here ensures that the Metrics code will finish as fast as
            // possible, send the POST request to the background and continue on with whatever else the application
            // needs to execute.
            'timeout' => (!$this->development_mode) ? 0.2 : 0,
        ]);

        $this->package_version = Versions::getVersion(self::PACKAGE_NAME);
    }

    /**
     * @todo Handle bad token 401 errors?
     * @todo Change this to a queueing model like in readme-node?
     * @param Request $request
     * @param Response $response
     * @throws MetricsException
     */
    public function track(Request $request, &$response): void
    {
        $log_id = Uuid::uuid4()->toString();
        $response->headers->set('x-readme-log', $log_id);

        $payload = $this->constructPayload($log_id, $request, $response);

        $headers = [
            'Authorization' => 'Basic ' . base64_encode($this->api_key . ':'),
            'User-Agent' => 'readme-metrics-php/' . $this->package_version
        ];

        // If not in development mode, all requests should be async.
        if (!$this->development_mode) {
            try {
                $promise = $this->client->postAsync('/request', [
                    'headers' => $headers,
                    'json' => [$payload]
                ]);

                $this->curl_handler->execute();
            } catch (\Exception $e) {
                // Usually this'll happen from a connection timeout exception from Guzzle trying to wait for us to
                // resolve the promise we set up, but since we just want this to be a fire and forget request, we don't
                // actually care about the response coming back from the Metrics API and all exceptions here can be
                // discarded.
            }

            return;
        }

        try {
            $metrics_response = $this->client->post('/request', [
                'headers' => $headers,
                'json' => [$payload]
            ]);
        } catch (\Exception $e) {
            throw $e;
        }

        $json = (string) $metrics_response->getBody();
        if ($json === 'OK') {
            return;
        }

        $json = json_decode($json);
        if (!isset($json->errors)) {
            // If we didn't get any errors back from the Metrics API, but didn't get an `OK` response, then something
            // must be up with it so don't worry about communicating that here since there isn't anything actionable
            // for the user.
            return;
        }

        $ex = new MetricsException(str_replace($json->_message, $json->name, $json->message));
        $ex->setErrors((array)$json->errors);
        throw $ex;
    }

    /**
     * @param string $log_id
     * @param Request $request
     * @param Response $response
     * @return array
     */
    public function constructPayload(string $log_id, Request $request, $response): array
    {
        $request_start = (!defined('LARAVEL_START')) ? LARAVEL_START : $_SERVER['REQUEST_TIME_FLOAT'];
        $group = $this->group_handler::constructGroup($request);

        if (!array_key_exists('id', $group)) {
            throw new \TypeError('Metrics grouping function did not return an array with an id present.');
        } elseif (empty($group['id'])) {
            throw new \TypeError('Metrics grouping function must not return an empty id.');
        }

        return [
            '_id' => $log_id,
            'group' => $group,
            'clientIPAddress' => $request->ip(),
            'development' => $this->development_mode,
            'request' => [
                'log' => [
                    'creator' => [
                        'name' => self::PACKAGE_NAME,
                        'version' => $this->package_version,
                        'comment' => PHP_OS_FAMILY . '/php v' . PHP_VERSION
                    ],
                    'entries' => [
                        [
                            'pageref' => $request->url(),
                            'startedDateTime' => date('c', $request_start),
                            'time' => (microtime(true) - $request_start) * 1000,
                            'request' => $this->processRequest($request),
                            'response' => $this->processResponse($response)
                        ]
                    ]
                ]
            ]
        ];
    }

    /**
     * @psalm-suppress TaintedInput
     */
    private function processRequest(Request $request): array
    {
        /**
         * Since Laravel (currently as of 6.8.0) dumps $_GET and $_POST into `->query` and `->request` instead of
         * putting $_GET into only `->query` and $_POST` into `->request`, we have no easy way way to dump only POST
         * data into `postData`. So because of that, we're eschewing that and manually reconstructing our potential
         * POST payload into an array here.
         *
         * @var array $params
         */
        $params = array_replace_recursive($_POST, $_FILES);
        if (!empty($this->blacklist)) {
            $params = $this->excludeDataFromBlacklist($params);
        } elseif (!empty($this->whitelist)) {
            $params = $this->excludeDataNotInWhitelist($params);
        }

        return [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'httpVersion' => $_SERVER['SERVER_PROTOCOL'],
            'headers' => static::convertHeaderBagToArray($request->headers),
            'queryString' => static::convertObjectToArray($_GET),
            'postData' => [
                'mimeType' => 'application/json',
                'params' => static::convertObjectToArray($params)
            ]
        ];
    }

    /**
     * @param Response $response
     * @return array
     */
    private function processResponse($response): array
    {
        if ($response instanceof JsonResponse) {
            $body = $response->getData(true);

            if (!empty($this->blacklist)) {
                $body = $this->excludeDataFromBlacklist($body);
            } elseif (!empty($this->whitelist)) {
                $body = $this->excludeDataNotInWhitelist($body);
            }
        } else {
            $body = $response->getContent();
        }

        $status_code = $response->getStatusCode();

        return [
            'status' => $status_code,
            'statusText' => isset(Response::$statusTexts[$status_code])
                ? Response::$statusTexts[$status_code]
                : 'Unknown status',
            'headers' => static::convertHeaderBagToArray($response->headers),
            'content' => [
                'text' => (is_scalar($body)) ? $body : json_encode($body),
                'size' => $response->headers->get('Content-Length', '0'),
                'mimeType' => $response->headers->get('Content-Type')
            ]
        ];
    }

    /**
     * Convert a HeaderBag into an acceptable nested array for the Metrics API.
     *
     * @param HeaderBag $headers
     * @return array
     */
    protected static function convertHeaderBagToArray(HeaderBag $headers): array
    {
        $output = [];
        foreach ($headers->all() as $name => $values) {
            foreach ($values as $value) {
                // If the header is empty, don't worry about it.
                if ($value === '') {
                    continue; // @codeCoverageIgnore
                }

                $output[] = [
                    'name' => $name,
                    'value' => $value
                ];
            }
        }

        return $output;
    }

    /**
     * Convert a key/value object-style array into an acceptable nested array for the Metrics API.
     *
     * @param array $input
     * @return array
     * @psalm-suppress PossiblyUndefinedArrayOffset
     */
    protected static function convertObjectToArray(array $input): array
    {
        return array_map(function ($key) use ($input) {
            if (isset($input[$key]['tmp_name'])) {
                $file = $input[$key];
                return [
                    'name' => $key,
                    'value' => file_get_contents($file['tmp_name']),
                    'fileName' => $file['name'],
                    'contentType' => MimeTypes::getDefault()->guessMimeType($file['tmp_name'])
                ];
            }

            return [
                'name' => $key,
                'value' => (is_scalar($input[$key])) ? $input[$key] : json_encode($input[$key])
            ];
        }, array_keys($input));
    }

    /**
     * Given an array, exclude data at the highest associative level of it based upon the configured whitelist.
     *
     * @param array $data
     * @return array
     */
    private function excludeDataFromBlacklist($data = []): array
    {
        // If `$data` is an array with associative keys, let's run the blacklist against that, otherwise run the
        // blacklist against the keys inside the top-level array.
        if ($this->isArrayAssoc($data)) {
            Arr::forget($data, $this->blacklist);
            return $data;
        }

        foreach ($data as $k => $v) {
            Arr::forget($data[$k], $this->blacklist);
        }

        return $data;
    }

    /**
     * Given an array, return only data at the highest level of it that matches the configured whitelist.
     *
     * @param array $data
     * @return array
     */
    private function excludeDataNotInWhitelist($data = []): array
    {
        $ret = [];

        // If `$data` is an array with associative keys, let's run the whitelist against that, otherwise run the
        // whitelist against the keys inside the top-level array.
        if ($this->isArrayAssoc($data)) {
            foreach ($this->whitelist as $key) {
                if (isset($data[$key])) {
                    $ret[$key] = $data[$key];
                }
            }

            return $ret;
        }

        foreach ($data as $idx => $v) {
            foreach ($this->whitelist as $key) {
                if (isset($v[$key])) {
                    $ret[$idx][$key] = $data[$idx][$key];
                }
            }
        }

        return $ret;
    }

    /**
     * Return whether or not a given array is associative.
     *
     * @param array $array
     * @return bool
     */
    private function isArrayAssoc($array = []): bool
    {
        return count(array_filter(array_keys($array), 'is_string')) > 0;
    }
}
