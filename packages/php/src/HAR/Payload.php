<?php

namespace ReadMe\HAR;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use ReadMe\Metrics;
use Symfony\Component\HttpFoundation\HeaderBag;
use Symfony\Component\HttpFoundation\Response;

class Payload
{
    public function __construct(private Metrics $metrics)
    {
    }

    public function create(string $log_id, Request $request, Response $response): array
    {
        $request_start = defined('LARAVEL_START') ? LARAVEL_START : $request->server('REQUEST_TIME_FLOAT');
        $group = $this->metrics->group_handler::constructGroup($request);

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
            // Swap the externally documented `api_key` field into backwards compatible and
            // internally used `id` field.
            $group['id'] = MaskHelper::mask($group['api_key']);
            unset($group['api_key']);
        }

        return [
            '_id' => $log_id,
            'group' => $group,
            'clientIPAddress' => $request->ip(),
            'development' => $this->metrics->isInDevelopmentMode(),
            'request' => [
                'log' => [
                    'creator' => [
                        'name' => 'readme-metrics (php)',
                        'version' => $this->metrics->getPackageVersion(),
                        'comment' => static::getHARCreatorVersion(),
                    ],
                    'entries' => [
                        [
                            'pageref' => $request->url(),
                            'startedDateTime' => date('Y-m-d\TH:i:sp', (int) $request_start),
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
     * Retrieve the version string that we'll use in the HAR `creator` object.
     *
     * @example arm64-darwin21.3.0/8.1.8
     */
    public static function getHARCreatorVersion(): string
    {
        return php_uname('m') . '-' . strtolower(php_uname('s')) . php_uname('r') . '/' . PHP_VERSION;
    }

    /**
     * Process an incoming request into a HAR `request` object.
     *
     * @psalm-suppress PossiblyInvalidArgument Psalm doesn't like our `$request->post()` and
     *      `$request->query()` calls as it thinks they need arguments. They don't.
     * @psalm-suppress DeprecatedMethod `Request::getContentType()` is deprecated and we should use
     *      `Request::getContentTypeFormat()` instead but `getContentTypeFormat` isn't available
     *      in all versions of Laravel that we support.
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#request}
     *
     * @psalm-suppress DeprecatedMethod `$request->getContentType()` is deprecated
     *      but the alternative isn't supported in some of the older versions that
     *      we support. Just going to ignore this for now until we can remove
     *      support for older versions and move over to the new function.
     */
    private function processRequest(Request $request): array
    {
        $post_data = false;
        $content_type = $request->headers->get('content-type', '');
        $is_file_upload_request = !!count($request->allFiles());

        if ($is_file_upload_request) {
            $post_data = [
                'mimeType' => $content_type,
                'params' => array_merge(
                    static::convertObjectToArray($this->sanitizeInputPerConfig($request->post())),
                    static::convertFileObjectForArray($this->sanitizeInputPerConfig($request->allFiles()))
                ),
            ];
        } elseif ($content_type !== null && str_contains($content_type, 'form')) {
            $post_data = [
                'mimeType' => $content_type,
                'params' => static::convertObjectToArray(
                    $this->sanitizeInputPerConfig($request->post())
                ),
            ];
        } elseif (!$request->isMethod('get')) {
            if (
                in_array($content_type, ['application/json', 'application/x-json', 'text/json', 'text/x-json' ]) ||
                ($content_type !== null && str_contains($content_type, '+json'))
            ) {
                // Normally we'd use `$request->post()` to get this data but in the case that the
                // payload is corrupted JSON `$request->post()` returns an empty array. Not ideal!
                try {
                    /** @var resource|string $contentRaw */
                    $contentRaw = $request->getContent();
                    if (is_resource($contentRaw)) {
                        $contentRaw = stream_get_contents($contentRaw);
                    }
                    $content = json_decode($contentRaw, true);
                    $content = $this->sanitizeInputPerConfig($content);
                    $content = json_encode($content);
                } catch (\Exception $e) {
                    $content = $request->all();
                }

                $post_data = [
                    'mimeType' => $content_type,
                    'text' => $content,
                ];
            } elseif ($content_type !== null && $content_type !== '') {
                $post_data = [
                    'mimeType' => $content_type,
                    'text' => $request->getContent()
                ];
            }
        }

        $res = [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'httpVersion' => $request->server('SERVER_PROTOCOL', 'HTTP/1.1'),
            'headers' => static::convertHeaderBagToArray($request->headers),
            'headersSize' => -1,
            'queryString' => static::convertObjectToArray($request->query()),
            'cookies' => static::convertObjectToArray($request->cookie()),
            'bodySize' => -1,
        ];

        if ($post_data) {
            $res['postData'] = $post_data;
        }

        return $res;
    }

    private function processResponse(Response $response): array
    {
        if ($response instanceof JsonResponse) {
            $body = $response->getData(true);

            if (!empty($this->metrics->getDenylist())) {
                $body = $this->excludeDataFromDenylist($body);
            } elseif (!empty($this->metrics->getAllowlist())) {
                $body = $this->excludeDataNotInAllowlist($body);
            }
        } else {
            $body = $response->getContent();
        }

        $status_code = $response->getStatusCode();

        /**
         * The webserver is what sets the `Content-Length` header so incase we don't have one here
         * yet let's compute our own based off of our response.
         *
         * Note that because we maybe be filtering items out from the HAR we send to Metrics this
         * number may not always match up with the length of `content.text`.
         *
         * @see {@link https://github.com/laravel/framework/issues/29227}
         */
        if ($response->headers->has('Content-Length')) {
            $content_size = $response->headers->get('Content-Length');
        } else {
            $content_size = strlen((string)$response->getContent());
        }

        return [
            'status' => $status_code,
            'statusText' => isset(Response::$statusTexts[$status_code])
                ? Response::$statusTexts[$status_code]
                : 'Unknown status',
            'headers' => static::convertHeaderBagToArray($response->headers),
            'headersSize' => -1,
            'bodySize' => (int)$content_size,
            'content' => [
                'text' => (is_scalar($body)) ? $body : json_encode($body),
                'size' => (int)$content_size,
                'mimeType' => $response->headers->get('Content-Type')
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
        if (!empty($this->metrics->getDenylist())) {
            return $this->excludeDataFromDenylist($data);
        } elseif (!empty($this->metrics->getAllowlist())) {
            return $this->excludeDataNotInAllowlist($data);
        }

        return $data;
    }

    /**
     * Given an array, exclude data at the highest associative level of it based upon the
     * configured allowlist.
     *
     */
    private function excludeDataFromDenylist(array $data = []): array
    {
        // If `$data` is an array with associative keys, let's run the denylist against that,
        // otherwise run the denylist against the keys inside the top-level array.
        if (static::isArrayAssoc($data)) {
            Arr::forget($data, $this->metrics->getDenylist());
            return $data;
        }

        foreach ($data as $k => $v) {
            Arr::forget($data[$k], $this->metrics->getDenylist());
        }

        return $data;
    }

    /**
     * Given an array, return only data at the highest level of it that matches the configured
     * allowlist.
     *
     */
    private function excludeDataNotInAllowlist(array $data = []): array
    {
        $ret = [];

        // If `$data` is an array with associative keys, let's run the allowlist against that,
        // otherwise run the allowlist against the keys inside the top-level array.
        if (static::isArrayAssoc($data)) {
            foreach ($this->metrics->getAllowlist() as $key) {
                if (isset($data[$key])) {
                    $ret[$key] = $data[$key];
                }
            }

            return $ret;
        }

        foreach ($data as $idx => $v) {
            foreach ($this->metrics->getAllowlist() as $key) {
                if (isset($v[$key])) {
                    $ret[$idx][$key] = $data[$idx][$key];
                }
            }
        }

        return $ret;
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
     * Convert a `$_FILES` object-style array into an acceptable nested array for the HAR payload.
     *
     * @see {@link https://github.com/ahmadnassri/har-spec/blob/master/versions/1.2.md#params}
     */
    protected static function convertFileObjectForArray(array $input): array
    {
        return array_map(function ($key) use ($input) {
            /** @var \Illuminate\Http\UploadedFile */
            $file = $input[$key];

            $mimeType = $file->getMimeType();
            $base64 = base64_encode(file_get_contents($file->getPathname()));
            $dataURL = join(';', [
                'data:' . $mimeType,
                'name=' . $file->getClientOriginalName(),
                'base64,' . $base64
            ]);

            return [
                'name' => $key,
                'value' => $dataURL,
                'fileName' => $file->getClientOriginalName(),
                'contentType' => $mimeType
            ];
        }, array_keys($input));
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
                if ($value === '' || $value === null) {
                    continue; // @codeCoverageIgnore
                }

                if (strtolower($name) === 'authorization') {
                    $value = MaskHelper::mask($value);
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
     * Return whether or not a given array is associative.
     *
     */
    private static function isArrayAssoc(array $array = []): bool
    {
        return count(array_filter(array_keys($array), 'is_string')) > 0;
    }
}
