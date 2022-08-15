<?php

namespace ReadMe;

use Composer\Factory;
use Composer\InstalledVersions;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\CurlMultiHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Ramsey\Uuid\Uuid;
use Symfony\Component\HttpFoundation\HeaderBag;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\MimeTypes;

class Metrics
{
    protected const PACKAGE_NAME = 'readme/metrics';
    protected const METRICS_API = 'https://metrics.readme.io';
    protected const README_API = 'https://dash.readme.io';

    private bool $development_mode = false;
    private array $denylist = [];
    private array $allowlist = [];
    private string|null $base_log_url = null;

    private CurlMultiHandler $curl_handler;
    private Client $client;
    private Client $readme_api_client;

    private string|null $package_version;
    private string $cache_dir;
    private string $user_agent;

    /**
     * @param string $api_key
     * @param class-string $group_handler
     * @param array $options
     */
    public function __construct(public string $api_key, public string $group_handler, array $options = [])
    {
        $this->api_key = base64_encode($api_key . ':');
        $this->group_handler = $group_handler;
        $this->development_mode = array_key_exists('development_mode', $options)
            ? (bool)$options['development_mode']
            : false;

        if (isset($options['denylist']) && is_array($options['denylist'])) {
            $this->denylist = $options['denylist'];
        } elseif (isset($options['blacklist']) && is_array($options['blacklist'])) {
            $this->denylist = $options['blacklist'];
        }

        if (isset($options['allowlist']) && is_array($options['allowlist'])) {
            $this->allowlist = $options['allowlist'];
        } elseif (isset($options['whitelist']) && is_array($options['whitelist'])) {
            $this->allowlist = $options['whitelist'];
        }

        if (!empty($options['base_log_url'])) {
            $this->base_log_url = $options['base_log_url'];
        }

        // In development mode, requests are sent asynchronously (as well as PHP can without directly invoking
        // shell cURL commands), so a very small timeout here ensures that the Metrics code will finish as fast as
        // possible, send the POST request to the background and continue on with whatever else the application
        // needs to execute.
        $curl_timeout = (!$this->development_mode) ? 0.2 : 0;

        $this->curl_handler = new CurlMultiHandler();
        $this->client = (isset($options['client'])) ? $options['client'] : new Client([
            'handler' => HandlerStack::create($this->curl_handler),
            'base_uri' => self::METRICS_API,
            'timeout' => $curl_timeout,
        ]);

        $this->readme_api_client = (isset($options['client_readme'])) ? $options['client_readme'] : new Client([
            'base_uri' => self::README_API,
            'timeout' => $curl_timeout,
        ]);

        $this->package_version = InstalledVersions::getVersion(self::PACKAGE_NAME);
        $this->cache_dir = Factory::createConfig()->get('cache-dir');

        $this->user_agent = 'readme-metrics-php/' . $this->package_version ?? 'unknown';
    }

    /**
     * @todo Handle bad token 401 errors?
     * @todo Change this to a queueing model like in readme-node?
     * @throws MetricsException
     */
    public function track(Request $request, Response &$response): void
    {
        if (empty($this->base_log_url)) {
            $this->base_log_url = $this->getProjectBaseUrl();
        }

        $log_id = Uuid::uuid4()->toString();
        if (!is_null($this->base_log_url)) {
            // Only set the header if we have a fully-formed log URL to give to users.
            $response->headers->set('x-documentation-url', $this->base_log_url . '/logs/' . $log_id);
        }

        $payload = $this->constructPayload($log_id, $request, $response);

        $headers = [
            'Authorization' => 'Basic ' . $this->api_key,
            'User-Agent' => $this->user_agent
        ];

        // If not in development mode, all requests should be async.
        if (!$this->development_mode) {
            try {
                $promise = $this->client->postAsync('/v1/request', [
                    'headers' => $headers,
                    'json' => [$payload]
                ]);

                $this->curl_handler->execute();
            } catch (\Exception $e) {
                // Usually this'll happen from a connection timeout exception from Guzzle trying to wait for us to
                // resolve the promise we set up, but since we just want this to be a fire and forget request, we don't
                // actually care about the response coming back from the Metrics API and all exceptions here can be
                // discarded.
                //
                // @todo we should log this somewhere
            }

            return;
        }

        try {
            $metrics_response = $this->client->post('/v1/request', [
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

    public function constructPayload(string $log_id, Request $request, Response $response): array
    {
        $request_start = defined('LARAVEL_START') ? LARAVEL_START : $_SERVER['REQUEST_TIME_FLOAT'];
        $group = $this->group_handler::constructGroup($request);

        $api_key_exists = array_key_exists('api_key', $group);
        $id_key_exists = array_key_exists('id', $group);
        if (!$api_key_exists and !$id_key_exists) {
            throw new \TypeError('Metrics grouping function did not return an array with an api_key present.');
        } elseif ($id_key_exists and empty($group['id'])) {
            throw new \TypeError('Metrics grouping function must not return an empty id.');
        } elseif ($api_key_exists and empty($group['api_key'])) {
            throw new \TypeError('Metrics grouping function must not return an empty api_key.');
        }

        if ($api_key_exists) {
            // Swap the externally documented `api_key` field into backwards compatible and internally used `id` field.
            $group['id'] = $group['api_key'];
            unset($group['api_key']);
        }

        return [
            '_id' => $log_id,
            'group' => $group,
            'clientIPAddress' => $request->ip(),
            'development' => $this->development_mode,
            'request' => [
                'log' => [
                    'creator' => [
                        'name' => 'readme-metrics (php)',
                        'version' => $this->package_version,
                        'comment' => self::getHARCreatorVersion(),
                    ],
                    'entries' => [
                        [
                            'pageref' => $request->url(),
                            'startedDateTime' => date('c', (int) $request_start),
                            'time' => (int) ((microtime(true) - $request_start) * 1000),
                            'request' => $this->processRequest($request),
                            'response' => $this->processResponse($response)
                        ]
                    ]
                ]
            ]
        ];
    }

    /**
     * Process an incoming request into a HAR `request` object.
     *
     * Because Laravel (currently as of 6.8.0) dumps `$_GET` and `$_POST` into `->query` and
     * `->request` instead of putting `$_GET` into only `->query` and `$_POST` into `->request`, we
     * have no easy way way to dump only POST data into `postData`. So because of that, we're opting
     * to instead use the `$_{METHOD}` global accessors instead of Laravel Request helper functions.
     *
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#request}
     */
    private function processRequest(Request $request): array
    {
        return [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'httpVersion' => $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1',
            'headers' => static::convertHeaderBagToArray($request->headers),
            'queryString' => static::convertObjectToArray($_GET),
            'postData' => [
                'mimeType' => 'application/json',
                'params' => array_merge(
                    static::convertObjectToArray($this->sanitizeInputPerConfig($_POST)),
                    static::convertFileObjectForArray($this->sanitizeInputPerConfig($_FILES))
                )
            ]
        ];
    }

    /**
     * Sanitize a set of data per the configured `denylist` and `allowlist`.
     *
     * @psalm-taint-escape file Psalm's taint analysis thinks that `$_POST` and `$_FILES` are
     *      unsafe because we're using `file_get_contents()` on `$data[]['tmp_name]` further down
     *      the stack in `convertFileObjectForArray` but because we're only doing this if it's in
     *      `$_FILES` it's safe.
     */
    private function sanitizeInputPerConfig(array $data): array
    {
        if (!empty($this->denylist)) {
            return $this->excludeDataFromDenylist($data);
        } elseif (!empty($this->allowlist)) {
            return $this->excludeDataNotInAllowlist($data);
        }

        return $data;
    }

    private function processResponse(Response $response): array
    {
        if ($response instanceof JsonResponse) {
            $body = $response->getData(true);

            if (!empty($this->denylist)) {
                $body = $this->excludeDataFromDenylist($body);
            } elseif (!empty($this->allowlist)) {
                $body = $this->excludeDataNotInAllowlist($body);
            }
        } else {
            /** @psalm-suppress ReservedWord */
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
     * Make an API request to ReadMe to retrieve the base log URL that'll be used to populate the `x-documentation-url`
     * header.
     *
     */
    private function getProjectBaseUrl(): ?string
    {
        $cache_file = $this->getCacheFile();
        $cache = new \stdClass();
        if (file_exists($cache_file)) {
            try {
                $cache = file_get_contents($cache_file);
                $cache = json_decode($cache);
            } catch (\Exception $e) {
                // If we can't decode the cache then we should act as if it doesn't exist and let it rehydrate itself.
            }
        }

        // Does the cache exist? If it doesn't, let's fill it. If it does, let's see if it's stale. Caches should have
        // a TTL of 1 day.
        $last_updated = property_exists($cache, 'last_updated') ? $cache->last_updated : null;

        if (is_null($last_updated) || (!is_null($last_updated) && abs($last_updated - time()) > 86400)) {
            try {
                $response = $this->readme_api_client->get('/api/v1/', [
                    'headers' => [
                        'Authorization' => 'Basic ' . $this->api_key,
                        'User-Agent' => $this->user_agent
                    ],
                ]);

                $json = (string) $response->getBody();
                $json = json_decode($json);

                $cache->base_url = $json->baseUrl;
                $cache->last_updated = time();
            } catch (\Exception $e) {
                // If we're running in development mode, toss any errors that happen when we try to call the ReadMe API.
                //
                // These errors will likely be from invalid API keys, so it'll be good to surface those to users before
                // it hits production.
                if ($this->development_mode) {
                    try {
                        // If we don't have a ClientException here, throw again so we end up below and handle this
                        // exception as a non-HTTP response problem.
                        if (!($e instanceof ClientException)) {
                            throw $e;
                        }

                        /** @psalm-suppress PossiblyNullReference */
                        $json = (string) $e->getResponse()->getBody();
                        $json = json_decode($json);
                    } catch (\Exception $e) {
                        $ex = new MetricsException($e->getMessage());
                        throw $ex;
                    }

                    throw new MetricsException($json->message);
                }

                // If unable to access the ReadMe API for whatever reason, let's set the last updated time to two
                // minutes from now yesterday so that in 2 minutes we'll automatically make another attempt.
                $cache->base_url = null;
                $cache->last_updated = (time() - 86400) + 120;
            }

            file_put_contents($cache_file, json_encode($cache));
        }

        return $cache->base_url;
    }

    /**
     * Retrieve the cache file that'll be used to store the base URL for the `x-documentation-url` header.
     *
     */
    public function getCacheFile(): string
    {
        // Since we might have differences of cache management, set the package version into the cache key so all
        // caches will automatically get refreshed when the package is updated/installed.
        $cache_key = join('-', [
            str_replace('/', '_', self::PACKAGE_NAME),
            $this->package_version,
            md5($this->api_key)
        ]);

        // Replace potentially unsafe characters in the cache key so it can be safely used as a filename on the server.
        $cache_key = str_replace([DIRECTORY_SEPARATOR, '@'], '-', $cache_key);

        return $this->cache_dir . DIRECTORY_SEPARATOR . $cache_key;
    }

    /**
     * Convert a Laravel `HeaderBag` into an acceptable nested headers array for the HAR payload.
     *
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#headers}
     */
    protected static function convertHeaderBagToArray(HeaderBag $headers): array
    {
        $output = [];
        foreach ($headers->all() as $name => $values) {
            /** @psalm-suppress PossiblyNullIterator */
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
     * Convert a `$_FILES` object-style array into an acceptable nested array for the HAR payload.
     *
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#params}
     */
    protected static function convertFileObjectForArray(array $input): array
    {
        return array_map(function ($key) use ($input) {
            // In order to protect ourselves from loading files of the filesystem that didn't come
            // from a real file upload and the `$_FILES` array we should only ever handle
            // `tmp_name` in the incoming payload if we know it's from a `$_FILES` context.
            //
            // If we don't do this then we open ourselves up to having bad actor $_POST payloads
            // mimicking themselves as a `$_FILES` payload in order to read and send something like
            $file = $input[$key];

            $mimeType = MimeTypes::getDefault()->guessMimeType($file['tmp_name']);
            $base64 = base64_encode(file_get_contents($file['tmp_name']));
            $dataURL = join(';', [
                'data:' . $mimeType,
                'name=' . $file['name'],
                'base64,' . $base64
            ]);

            return [
                'name' => $key,
                'value' => $dataURL,
                'fileName' => $file['name'],
                'contentType' => $mimeType
            ];
        }, array_keys($input));
    }

    /**
     * Convert a key/value object-style array into an acceptable nested array for the HAR payload.
     *
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#querystring}
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#params}
     */
    protected static function convertObjectToArray(array $input): array
    {
        return array_map(function ($key) use ($input) {
            return [
                'name' => $key,
                'value' => (is_scalar($input[$key])) ? $input[$key] : json_encode($input[$key])
            ];
        }, array_keys($input));
    }

    /**
     * Retrieve the version string that we'll use in the HAR `creator` object.
     *
     * @example arm64-darwin21.3.0/8.1.8
     */
    public static function getHARCreatorVersion(): string
    {
        return php_uname('m') . '-' . strtolower(php_uname('s')) . php_uname('r') . '/' . PHP_VERSION;
    }

    /**
     * Given an array, exclude data at the highest associative level of it based upon the configured allowlist.
     *
     */
    private function excludeDataFromDenylist(array $data = []): array
    {
        // If `$data` is an array with associative keys, let's run the denylist against that, otherwise run the
        // denylist against the keys inside the top-level array.
        if ($this->isArrayAssoc($data)) {
            Arr::forget($data, $this->denylist);
            return $data;
        }

        foreach ($data as $k => $v) {
            Arr::forget($data[$k], $this->denylist);
        }

        return $data;
    }

    /**
     * Given an array, return only data at the highest level of it that matches the configured allowlist.
     *
     */
    private function excludeDataNotInAllowlist(array $data = []): array
    {
        $ret = [];

        // If `$data` is an array with associative keys, let's run the allowlist against that, otherwise run the
        // allowlist against the keys inside the top-level array.
        if ($this->isArrayAssoc($data)) {
            foreach ($this->allowlist as $key) {
                if (isset($data[$key])) {
                    $ret[$key] = $data[$key];
                }
            }

            return $ret;
        }

        foreach ($data as $idx => $v) {
            foreach ($this->allowlist as $key) {
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
     */
    private function isArrayAssoc(array $array = []): bool
    {
        return count(array_filter(array_keys($array), 'is_string')) > 0;
    }
}
