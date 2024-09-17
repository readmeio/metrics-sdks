<?php

namespace ReadMe;

use Composer\Factory;
use Composer\InstalledVersions;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\CurlMultiHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;
use ReadMe\HAR\Payload;
use Symfony\Component\HttpFoundation\Response;

class Metrics
{
    protected const PACKAGE_NAME = 'readme/metrics';
    protected const METRICS_SERVER = 'https://metrics.readme.io';
    protected const README_API = 'https://dash.readme.com';

    private bool $development_mode = false;
    private array $denylist = [];
    private array $allowlist = [];
    private string|null $base_log_url = null;

    private CurlMultiHandler $curl_handler;
    private Client $client;
    private Client $readme_api_client;

    private string|null $package_version;
    private string|null $cache_dir;
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
            'base_uri' => env('README_METRICS_SERVER', self::METRICS_SERVER),
            'timeout' => $curl_timeout,
        ]);

        $this->readme_api_client = (isset($options['client_readme'])) ? $options['client_readme'] : new Client([
            'base_uri' => self::README_API,
            'timeout' => $curl_timeout,
        ]);

        $this->package_version = InstalledVersions::getVersion(self::PACKAGE_NAME);
        $this->cache_dir = null;

        $this->user_agent = 'readme-metrics-php/' . ($this->package_version ?? 'unknown');
    }

    /**
     * @todo Handle bad token 401 errors?
     * @todo Change this to a queueing model like in readme-node?
     * @throws MetricsException
     */
    public function track(Request $request, Response &$response): void
    {
        if ($request->getMethod() === 'OPTIONS') {
            return;
        }

        if ($this->base_log_url === null || $this->base_log_url === '') {
            $this->base_log_url = $this->getProjectBaseUrl();
        }

        $log_id = Uuid::uuid4()->toString();
        if (!is_null($this->base_log_url)) {
            // Only set the header if we have a fully-formed log URL to give to users.
            $response->headers->set('x-documentation-url', $this->base_log_url . '/logs/' . $log_id);
        }

        $payload = (new Payload($this))->create($log_id, $request, $response);

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

        /** @psalm-suppress PossiblyInvalidArgument */
        $ex = new MetricsException(str_replace($json->_message, $json->name, $json->message));
        $ex->setErrors((array)$json->errors);
        throw $ex;
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

        return $this->getCacheDir() . DIRECTORY_SEPARATOR . $cache_key;
    }

    /**
     * Retrieve the cache dir where the cache file will be stored.
     *
     */
    public function getCacheDir(): string
    {
        if ($this->cache_dir === null) {
            $this->cache_dir = Factory::createConfig()->get('cache-dir');
        }

        return $this->cache_dir;
    }

    public function getPackageVersion(): ?string
    {
        return $this->package_version;
    }

    public function isInDevelopmentMode(): bool
    {
        return $this->development_mode;
    }

    public function getDenylist(): array
    {
        return $this->denylist;
    }

    public function getAllowlist(): array
    {
        return $this->allowlist;
    }
}
