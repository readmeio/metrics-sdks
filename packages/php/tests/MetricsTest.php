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
use ReadMe\Tests\Fixtures\TestHandlerReturnsDeprecatedIDField;
use ReadMe\Tests\Fixtures\TestHandlerReturnsEmptyId;
use ReadMe\Tests\Fixtures\TestHandlerReturnsEmptyAPIKey;
use ReadMe\Tests\Fixtures\TestHandlerReturnsNoData;
use Symfony\Component\HttpFoundation\HeaderBag;
use Symfony\Component\HttpFoundation\Response;

class MetricsTest extends \PHPUnit\Framework\TestCase
{
    private const UUID_PATTERN = '/([a-z0-9\-]+)/';

    private const MOCK_RESPONSE_HEADERS = [
        'cache-control' => 'no-cache, private',
        'x-ratelimit-limit' => 60,
        'x-ratelimit-remaining' => 58,

        // HeaderBag sets its own date header, but since we don't care what it actually is we're overriding it here for
        // our mocks
        'date' => 'date.now()'
    ];

    /**
     * @example ?val=1&arr[]=&arr[]=3
     */
    private const MOCK_QUERY_PARAMS = [
        'val' => '1',
        'arr' => [null, '3'],
    ];

    private const MOCK_POST_PARAMS = [
        'password' => '123456',
        'apiKey' => 'abcdef',
        'another' => 'Hello world'
    ];

    private const MOCK_FILES_PARAMS = [
        'testfileparam' => [
            'name' => 'owlbert.png',
            'type' => 'application/octet-stream',
            'tmp_name' => __DIR__ . '/fixtures/owlbert.png',
            'error' => 0,
            'size' => 400
        ]
    ];

    /** @var Metrics */
    private $metrics;

    /** @var class-string */
    private $group_handler = TestHandler::class;

    /** @var array */
    private $api_calls = [];

    /** @var array */
    private $api_calls_to_readme = [];

    /** @var string */
    private $readme_api_key = 'mockReadMeApiKey';

    /** @var string */
    private $base_log_url = 'https://docs.example.com';

    /** @var string */
    private $log_uuid;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        define('LARAVEL_START', microtime(true));
        $_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
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

        // Clean up the cache dir between tests. Caching to the filesystem should probably be mocked out. 🤷‍♂️
        $cache_file = $this->metrics->getCacheFile();
        if (file_exists($cache_file)) {
            unlink($cache_file);
        }
    }

    /**
     * @group track
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
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
            'method' => 'GET',
            'url' => '?val=1&arr%5B1%5D=3',
            'httpVersion' => 'HTTP/1.1',
            'headers' => [
                [
                    'name' => 'cache-control',
                    'value' => 'max-age=0'
                ],
                [
                    'name' => 'user-agent',
                    'value' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...'
                ]
            ],
            'queryString' => [
                ['name' => 'val', 'value' => '1'],
                ['name' => 'arr', 'value' => '[null,"3"]']
            ],
            'postData' => [
                'mimeType' => 'application/json',
                'params' => []
            ]
        ], $actual_payload['request']['log']['entries'][0]['request']);

        // Make sure that our x-readme-log header ended up being logged as a response header in the metrics request.
        $response_headers = $actual_payload['request']['log']['entries'][0]['response']['headers'];
        $readme_log_header = array_filter($response_headers, function ($header) {
            return $header['name'] === 'x-documentation-url';
        });

        $this->assertSame($log_id, $this->getLogIdFromDocumentationHeader(array_shift($readme_log_header)['value']));
    }

    /**
     * @group track
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
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
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
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
     * @group constructPayload
     */
    public function testConstructPayload(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $this->metrics->constructPayload('fake-uuid', $request, $response);

        $this->assertSame('fake-uuid', $payload['_id']);

        $this->assertEqualsCanonicalizing([
            'id' => '123457890',
            'label' => 'username',
            'email' => 'email@example.com'
        ], $payload['group']);

        $this->assertSame('8.8.8.8', $payload['clientIPAddress']);
        $this->assertFalse($payload['development']);

        $this->assertSame('readme/metrics', $payload['request']['log']['creator']['name']);
        $this->assertIsString($payload['request']['log']['creator']['version']);
        $this->assertSame(PHP_OS_FAMILY . '/php v' . PHP_VERSION, $payload['request']['log']['creator']['comment']);

        $this->assertCount(1, $payload['request']['log']['entries']);

        $payload_entry = $payload['request']['log']['entries'][0];
        $this->assertSame($request->url(), $payload_entry['pageref']);
        $this->assertMatchesRegularExpression(
            '/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})\+(\d{2}:\d{2})/',
            $payload_entry['startedDateTime'],
            'startedDateTime was not in a format matching `2019-12-19T01:17:51+00:00`.'
        );

        $this->assertIsInt($payload_entry['time']);
        $this->assertIsNumeric($payload_entry['time']);
        $this->assertGreaterThan(0, $payload_entry['time']);

        // Assert that the request was set up properly.
        $payload_request = $payload_entry['request'];
        $this->assertSame($request->method(), $payload_request['method']);
        $this->assertSame($request->fullUrl(), $payload_request['url']);
        $this->assertSame('HTTP/1.1', $payload_request['httpVersion']);

        $this->assertSame([
            ['name' => 'cache-control', 'value' => 'max-age=0'],
            ['name' => 'user-agent', 'value' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...']
        ], $payload_request['headers']);

        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => '[null,"3"]']
        ], $payload_request['queryString']);

        $this->assertSame('application/json', $payload_request['postData']['mimeType']);
        $this->assertEmpty(
            $payload_request['postData']['params'],
            'postData should not have any data here because there is none for this GET request'
        );

        // Assert that the response was set as expected into the payload.
        $payload_response = $payload_entry['response'];
        $this->assertSame(200, $payload_response['status']);
        $this->assertSame('OK', $payload_response['statusText']);

        $this->assertEqualsCanonicalizing([
            ['name' => 'cache-control', 'value' => 'no-cache, private'],
            ['name' => 'content-type', 'value' => 'application/json'],
            ['name' => 'x-ratelimit-limit', 'value' => 60],
            ['name' => 'x-ratelimit-remaining', 'value' => 58],
            ['name' => 'date', 'value' => 'date.now()']
        ], $payload_response['headers']);

        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
        ], json_decode($payload_response['content']['text'], true));

        $this->assertEquals($response->headers->get('Content-Length', 0), $payload_response['content']['size']);
        $this->assertSame($response->headers->get('Content-Type'), $payload_response['content']['mimeType']);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadWithNonJsonResponse(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockTextResponse();
        $payload = $this->metrics->constructPayload('fake-uuid', $request, $response);

        $payload_response = $payload['request']['log']['entries'][0]['response'];
        $this->assertSame(200, $payload_response['status']);
        $this->assertSame('OK', $payload_response['statusText']);
        $this->assertSame('OK COMPUTER', $payload_response['content']['text']);
        $this->assertSame('11', $payload_response['content']['size']);
        $this->assertSame('text/plain', $payload_response['content']['mimeType']);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadWithUploadFileInRequest(): void
    {
        $request = $this->getMockRequest([], self::MOCK_POST_PARAMS, self::MOCK_FILES_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $this->metrics->constructPayload('fake-uuid', $request, $response);

        $params = $payload['request']['log']['entries'][0]['request']['postData']['params'];
        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world'],
            [
                'name' => 'testfileparam',
                'value' => file_get_contents(__DIR__ . '/fixtures/owlbert.dataurl.txt'),
                'fileName' => 'owlbert.png',
                'contentType' => 'image/png'
            ]
        ], $params);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadWithUnsafeFileInPOSTRequest(): void
    {
        $unsafe_payload = [
            'testfileparam' => [
                'name' => 'pwned',
                'type' => 'application/octet-stream',
                'tmp_name' => '/etc/passwd',
                'error' => 0,
                'size' => 0
            ]
        ];

        $request = $this->getMockRequest([], $unsafe_payload);
        $response = $this->getMockJsonResponse();
        $payload = $this->metrics->constructPayload('fake-uuid', $request, $response);

        $params = $payload['request']['log']['entries'][0]['request']['postData']['params'];
        $this->assertSame([
            [
                'name' => 'testfileparam',
                'value' => json_encode($unsafe_payload['testfileparam'])
            ]
        ], $params);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadWithAPIKey(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $metrics = new Metrics($this->readme_api_key, $this->group_handler);
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $this->assertArrayHasKey('id', $payload['group']);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadWithDeprecatedIDField(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $metrics = new Metrics($this->readme_api_key, TestHandlerReturnsDeprecatedIDField::class);
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $this->assertArrayHasKey('id', $payload['group']);
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadShouldThrowErrorIfGroupFunctionDoesNotReturnExpectedPayload(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/did not return an array with an api_key present/');

        $request = \Mockery::mock(Request::class);
        $response = \Mockery::mock(JsonResponse::class);

        (new Metrics($this->readme_api_key, TestHandlerReturnsNoData::class))->constructPayload(
            'fake-uuid',
            $request,
            $response
        );
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadShouldThrowErrorIfGroupFunctionReturnsAnEmptyAPIKey(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/must not return an empty api_key/');

        $request = \Mockery::mock(Request::class);
        $response = \Mockery::mock(JsonResponse::class);

        (new Metrics($this->readme_api_key, TestHandlerReturnsEmptyAPIKey::class))->constructPayload(
            'fake-uuid',
            $request,
            $response
        );
    }

    /**
     * @group constructPayload
     */
    public function testConstructPayloadShouldThrowErrorIfGroupFunctionReturnsAnEmptyId(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/must not return an empty id/');

        $request = \Mockery::mock(Request::class);
        $response = \Mockery::mock(JsonResponse::class);

        (new Metrics($this->readme_api_key, TestHandlerReturnsEmptyId::class))->constructPayload(
            'fake-uuid',
            $request,
            $response
        );
    }

    /**
     * @group processRequest
     */
    public function testProcessRequestShouldFilterOutItemsInDenyList(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'denylist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $request_data = $payload['request']['log']['entries'][0]['request'];

        // Denylist should not affect $_GET params.
        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => '[null,"3"]']
        ], $request_data['queryString']);

        $params = $request_data['postData']['params'];
        $this->assertSame([
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world']
        ], $params);
    }

    /**
     * @group processRequest
     */
    public function testProcessRequestShouldFilterOnlyItemsInAllowlist(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'allowlist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $request_data = $payload['request']['log']['entries'][0]['request'];

        // Allowlist should not affect $_GET params.
        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => '[null,"3"]']
        ], $request_data['queryString']);

        $params = $request_data['postData']['params'];
        $this->assertSame([
            ['name' => 'password', 'value' => '123456']
        ], $params);
    }

    /**
     * @group processRequest
     */
    public function testProcessRequestShouldFilterOutItemsInDeprecatedBlacklist(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'blacklist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $request_data = $payload['request']['log']['entries'][0]['request'];

        // Blacklist should not affect $_GET params.
        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => '[null,"3"]']
        ], $request_data['queryString']);

        $params = $request_data['postData']['params'];
        $this->assertSame([
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world']
        ], $params);
    }

    /**
     * @group processRequest
     */
    public function testProcessRequestShouldFilterOnlyItemsInDeprecatedWhitelist(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'whitelist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $request_data = $payload['request']['log']['entries'][0]['request'];

        // Whitelist should not affect $_GET params.
        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => '[null,"3"]']
        ], $request_data['queryString']);

        $params = $request_data['postData']['params'];
        $this->assertSame([
            ['name' => 'password', 'value' => '123456']
        ], $params);
    }

    /**
     * @group processResponse
     */
    public function testProcessResponseShouldFilterOutItemsInBlacklist(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'blacklist' => ['value']
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $content = $payload['request']['log']['entries'][0]['response']['content'];

        $this->assertSame([
            ['name' => 'password'],
            ['name' => 'apiKey']
        ], json_decode($content['text'], true));
    }

    /**
     * @group processResponse
     */
    public function testProcessResponseShouldFilterOnlyItemsInWhitelist(): void
    {
        $metrics = new Metrics($this->readme_api_key, $this->group_handler, [
            'whitelist' => ['value']
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload('fake-uuid', $request, $response);

        $content = $payload['request']['log']['entries'][0]['response']['content'];

        $this->assertSame([
            ['value' => '123456'],
            ['value' => 'abcdef']
        ], json_decode($content['text'], true));
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertEmpty(
            $this->api_calls_to_readme,
            'A call was made to ReadMe to get the baseUrl even though it was supplied.'
        );
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertEmpty(
            $this->api_calls_to_readme,
            'A call was made to ReadMe to get the baseUrl even though it was fresh in the cache.'
        );
    }

    /**
     * @group getProjectBaseUrl
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        $this->assertCount(
            1,
            $this->api_calls_to_readme,
            'A call was not made to ReadMe to get the baseUrl when the cache is stale.'
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $this->metrics->track($request, $response);

        // Since the call to ReadMe failed, the `x-documentation-url` header shouldn't be present as we didn't get a
        // base log URL to create suffix against.
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
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

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
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

    private function getMockRequest($query_params = [], $post_params = [], $file_params = []): Request
    {
        $_GET = $query_params;
        $_POST = $post_params;
        $_FILES = $file_params;

        $request = \Mockery::mock(Request::class, [
            'ip' => '8.8.8.8',
            'url' => 'http://api.example.com/v1/user',
            'method' => 'GET',
            'fullUrl' => 'http://api.example.com/v1/user' .
                (!empty($query_params)) ? '?' . http_build_query($query_params) : null
        ])->makePartial();

        $request->headers = \Mockery::mock(HeaderBag::class, [
            'all' => [
                'cache-control' => ['max-age=0'],
                'user-agent' => [
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...'
                ]
            ]
        ]);

        return $request;
    }

    private function getMockJsonResponse(): JsonResponse
    {
        return new JsonResponse(
            [
                ['name' => 'password', 'value' => '123456'],
                ['name' => 'apiKey', 'value' => 'abcdef'],
            ],
            200,
            array_merge(self::MOCK_RESPONSE_HEADERS, [
                'Content-Type' => 'application/json'
            ])
        );
    }

    private function getMockTextResponse(): Response
    {
        return new Response(
            'OK COMPUTER',
            200,
            array_merge(self::MOCK_RESPONSE_HEADERS, [
                'Content-Type' => 'text/plain',
                'Content-Length' => 11
            ])
        );
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
