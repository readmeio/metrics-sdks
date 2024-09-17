<?php

namespace ReadMe\Tests;

use GuzzleHttp\Client;
use GuzzleHttp\Middleware;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ReadMe\Metrics;
use ReadMe\MetricsException;
use ReadMe\Tests\Fixtures\TestHandler;

class MetricsTest extends \PHPUnit\Framework\TestCase
{
    private const UUID_PATTERN = '/([a-z0-9\-]+)/';

    private Metrics $metrics;

    /** @var class-string|string */
    private $group_handler = TestHandler::class;

    private array $api_calls = [];
    private array $api_calls_to_readme = [];
    private string $readme_api_key = 'mockReadMeApiKey';
    private string $base_log_url = 'https://docs.example.com';

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (!defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        $this->api_calls = [];
        $this->api_calls_to_readme = [];

        // Clean up the cache dir between tests. Caching to the filesystem should probably be
        // mocked out. 🤷‍♂️
        $cache_file = $this->metrics->getCacheFile();
        if (file_exists($cache_file)) {
            unlink($cache_file);
        }
    }

    /**
     * @group track
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testTrack(bool $development_mode): void
    {
        // Mock out a 200 request from the Metrics and ReadMe APIs.
        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200, [], 'OK'),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        // Assert that the `x-documentation-url` header was properly added into the current response.
        $this->assertContains('x-documentation-url', array_keys($response->headers->all()));
        $documentation_header = array_shift($response->headers->all()['x-documentation-url']);
        $log_id = $this->getLogIdFromDocumentationHeader($documentation_header);
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, $log_id);

        // Assert that we only tracked a single request and also the payload looks as expected.
        $this->assertCount(1, $this->api_calls);

        $actual_request = array_shift($this->api_calls);
        $actual_request = $actual_request['request'];

        $this->assertSame('/v1/request', $actual_request->getRequestTarget());

        $actual_payload = json_decode($actual_request->getBody(), true);
        $this->assertCount(1, $actual_payload);

        $actual_payload = array_shift($actual_payload);
        $this->assertSame(['_id', 'group', 'clientIPAddress', 'development', 'request'], array_keys($actual_payload));
        $this->assertSame($log_id, $actual_payload['_id']);

        $this->assertSame([
            'method' => 'POST',
            'url' => 'https://api.example.com/v1/user?arr%5B1%5D=3&val=1',
            'httpVersion' => 'HTTP/1.1',
            'headers' => [
                ['name' => 'host', 'value' => 'api.example.com'],
                ['name' => 'user-agent', 'value' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...'],
                ['name' => 'accept', 'value' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
                ['name' => 'accept-language', 'value' => 'en-us,en;q=0.5'],
                ['name' => 'accept-charset', 'value' => 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'],
                ['name' => 'content-type', 'value' => 'application/json']
            ],
            'headersSize' => -1,
            'queryString' => [
                ['name' => 'arr', 'value' => json_encode([1 => '3'])],
                ['name' => 'val', 'value' => '1'],
            ],
            'cookies' => [],
            'bodySize' => -1,
            'postData' => [
                'mimeType' => 'application/json',
                'text' => json_encode([
                    'password' => '123456',
                    'apiKey' => 'abcdef',
                    'another' => 'Hello world'
                ])
            ]
        ], $actual_payload['request']['log']['entries'][0]['request']);

        // Make sure that our `x-readme-log` header ended up being logged as a response header in
        // the metrics request.
        $response_headers = $actual_payload['request']['log']['entries'][0]['response']['headers'];
        $readme_log_header = array_filter($response_headers, function ($header) {
            return $header['name'] === 'x-documentation-url';
        });

        $this->assertSame($log_id, $this->getLogIdFromDocumentationHeader(array_shift($readme_log_header)['value']));
    }

    /**
     * @group track
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testTrackHandlesApiErrors(bool $development_mode): void
    {
        if ($development_mode) {
            $this->expectException(MetricsException::class);
            // `RequestModel` from the API response should get swapped out with `ValidationError`.
            $this->expectExceptionMessage('ValidationError: queryString.0.value: Path `value` is required.');
        }

        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200, [], json_encode([
                'errors' => [
                    'queryString.0.value' => [
                        'message' => 'Path `value` is required.',
                        'name' => 'ValidatorError',
                        'properties' => [
                            'kind' => 'required',
                            'path' => 'value'
                        ]
                    ]
                ],
                '_message' => 'RequestModel validation failed',
                'message' => 'RequestModel validation failed: queryString.0.value: Path `value` is required.',
                'name' => 'ValidationError',
            ])),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        if (!$development_mode) {
            $this->assertTrue(
                true,
                'When not in development mode, exceptions should not have been thrown so this assertion should pass.'
            );
        }
    }

    /**
     * @group track
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testTrackHandlesApiServerUnavailability(bool $development_mode): void
    {
        // Exceptions **should** be thrown under development mode!
        if ($development_mode) {
            $this->expectException(ServerException::class);
            $this->expectExceptionMessageMatches('/500 Internal Server Error/');
        }

        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(500),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        if (!$development_mode) {
            $this->assertTrue(
                true,
                'When not in development mode, exceptions should not be thrown which means this assertion should pass.'
            );
        }
    }

    /**
     * @group track
     */
    public function testTrackIgnoresOptionsMethod(): void
    {
        $request = new Request([], [], [], [], [], ['REQUEST_METHOD' => 'OPTIONS']);
        $response = $this->getMockJsonResponse();

        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200, [], 'OK'),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => false,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $this->metrics->track($request, $response);
        $this->assertEmpty($this->api_calls, 'No API calls should be made for OPTIONS requests.');
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testProjectBaseUrlIsNotFetchedIfSuppliedAsOption(bool $development_mode): void
    {
        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'base_log_url' => $this->base_log_url,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertEmpty(
            $this->api_calls_to_readme,
            'A call was made to ReadMe to get the `baseUrl` even though it was supplied in the middleware config.'
        );
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testProjectBaseUrlNotFetchedIfCacheIsFresh(bool $development_mode): void
    {
        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        // Hydrate the cache so it can be seen as fresh
        file_put_contents($this->metrics->getCacheFile(), json_encode([
            'base_url' => $this->base_log_url,
            'last_updated' => time()
        ]));

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertEmpty(
            $this->api_calls_to_readme,
            'A call was made to ReadMe to get the `baseUrl` even though it was fresh in the cache.'
        );
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     */
    public function testProjectBaseUrlDataCacheIsRefreshedIfStale(bool $development_mode): void
    {
        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(200, [], json_encode(['baseUrl' => $this->base_log_url]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        // Hydrate the cache so it can be seen as fresh
        file_put_contents($this->metrics->getCacheFile(), json_encode([
            'base_url' => $this->base_log_url,
            'last_updated' => time() - (86400 * 2)
        ]));

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertCount(
            1,
            $this->api_calls_to_readme,
            'A call was not made to ReadMe to get the `baseUrl` when the cache is stale.'
        );
    }

    /**
     * @group getProjectBaseUrl
     */
    public function testProjectBaseUrlIsTemporarilyNullIfReadMeCallFailsWhileNotInDevelopmentMode(): void
    {
        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(401, [], json_encode([
                'error' => 'APIKEY_NOTFOUNDD',
                'message' => "We couldn't find your API key",
                'suggestion' => "The API key you passed in (moc··········Key) doesn't match any keys we have in our " .
                    'system. API keys must be passed in as the username part of basic auth. You can get your API ' .
                    'key in Configuration > API Key, or in the docs.',
                'docs' => 'https://docs.readme.com/developers/logs/fake-uuid',
                'help' => "If you need help, email support@readme.io and mention log 'fake-uuid'.",
            ]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => false,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        // Since the call to ReadMe failed, the `x-documentation-url` header shouldn't be present
        // as we didn't get a base log URL to create suffix against.
        $this->assertNotContains('x-documentation-url', array_keys($response->headers->all()));

        $cache = json_decode(file_get_contents($this->metrics->getCacheFile()));
        $this->assertNull($cache->base_url);
    }

    /**
     * @group getProjectBaseUrl
     */
    public function testProjectBaseUrlFailsInDevelopmentModeIfReadMeCallHasErrorResponse(): void
    {
        $this->expectException(MetricsException::class);
        $this->expectExceptionMessageMatches("/We couldn't find your API key/");

        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(401, [], json_encode([
                'error' => 'APIKEY_NOTFOUNDD',
                'message' => "We couldn't find your API key",
                'suggestion' => "The API key you passed in (moc··········Key) doesn't match any keys we have in our " .
                    'system. API keys must be passed in as the username part of basic auth. You can get your API ' .
                    'key in Configuration > API Key, or in the docs.',
                'docs' => 'https://docs.readme.com/developers/logs/fake-uuid',
                'help' => "If you need help, email support@readme.io and mention log 'fake-uuid'.",
            ]))
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => true,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);
    }

    /**
     * @group getProjectBaseUrl
     */
    public function testProjectBaseUrlFailsInDevelopmentModeIfItCantTalkToReadMe(): void
    {
        $this->expectException(MetricsException::class);
        $this->expectExceptionMessageMatches('/500 Internal Server Error/');

        $handlers = $this->getMockHandlers(
            new \GuzzleHttp\Psr7\Response(200),
            new \GuzzleHttp\Psr7\Response(500)
        );

        $this->metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'development_mode' => true,
            'client' => new Client(['handler' => $handlers->metrics]),
            'client_readme' => new Client(['handler' => $handlers->readme])
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);
    }

    private function getMockHandlers(
        \GuzzleHttp\Psr7\Response $mock_metrics_response,
        \GuzzleHttp\Psr7\Response $mock_readme_response = null
    ): \stdClass {
        $handlers = new \stdClass();

        $mock = new MockHandler([$mock_metrics_response]);
        $handlers->metrics = HandlerStack::create($mock);
        $handlers->metrics->push(Middleware::history($this->api_calls));

        if (empty($mock_readme_response)) {
            $handlers->readme = null;
        } else {
            $mock = new MockHandler([$mock_readme_response]);
            $handlers->readme = HandlerStack::create($mock);
            $handlers->readme->push(Middleware::history($this->api_calls_to_readme));
        }

        return $handlers;
    }

    private function getMockRequest(): Request
    {
        $request = new \Illuminate\Http\Request();
        return $request->createFromBase(
            \Symfony\Component\HttpFoundation\Request::create(
                'https://api.example.com/v1/user/?arr%5B1%5D=3&val=1',
                'post',
                [],
                [],
                [],
                [
                    'CONTENT_TYPE' => 'application/json',
                    'CACHE-CONTROL' => 'max-age=0',
                    'REMOTE_ADDR' => '8.8.8.8',
                    'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...',
                ],
                json_encode([
                    'password' => '123456',
                    'apiKey' => 'abcdef',
                    'another' => 'Hello world'
                ])
            )
        );

        return $request;
    }

    private function getMockJsonResponse(): JsonResponse
    {
        return new JsonResponse([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
        ], 200);
    }

    private function getLogIdFromDocumentationHeader(string $header): string
    {
        return str_replace($this->base_log_url . '/logs/', '', $header);
    }

    public function providerDevelopmentModeToggle(): array
    {
        return [
            'development mode on' => [true],
            'development mode off' => [false],
        ];
    }
}
