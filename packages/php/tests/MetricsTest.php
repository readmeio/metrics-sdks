<?php
namespace ReadMe\Tests;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ReadMe\Metrics;
use ReadMe\MetricsException;
use ReadMe\Tests\Fixtures\TestHandler;
use ReadMe\Tests\Fixtures\TestHandlerReturnsEmptyId;
use ReadMe\Tests\Fixtures\TestHandlerReturnsNoData;
use Symfony\Component\HttpFoundation\HeaderBag;
use Symfony\Component\HttpFoundation\Response;

class MetricsTest extends \PHPUnit\Framework\TestCase
{
    private const MOCK_RESPONSE_HEADERS = [
        'cache-control' => ['no-cache, private'],
        'content-type' => ['application/json'],
        'x-ratelimit-limit' => [60],
        'x-ratelimit-remaining' => [58]
    ];

    // ?val=1&arr[]=&arr[]=3
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
            'name' => 'owlbert',
            'type' => 'application/octet-stream',
            'tmp_name' => __DIR__ . '/fixtures/owlbert.png',
            'error' => 0,
            'size' => 701048
        ]
    ];

    /** @var Metrics */
    private $metrics;

    /** @var class-string */
    private $group_handler = TestHandler::class;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        define('LARAVEL_START', microtime(true));
        $_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->metrics = new Metrics('fakeApiKey', $this->group_handler);
    }

    /**
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
     */
    public function testTrack(bool $development_mode): void
    {
        $mock = new MockHandler([
            new \GuzzleHttp\Psr7\Response(200, [], 'OK'),
        ]);

        $handlerStack = HandlerStack::create($mock);
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlerStack])
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        try {
            $metrics->track($request, $response);
            $this->assertTrue(true);
        } catch (\Exception $e) {
            $this->fail('No exceptions should have been thrown for a valid request.');
        }
    }

    /**
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

        $mock = new MockHandler([
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
        ]);

        $handlerStack = HandlerStack::create($mock);
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client([
                'handler' => $handlerStack
            ])
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $metrics->track($request, $response);

        if (!$development_mode) {
            $this->assertTrue(
                true,
                'When not in development mode, exceptions should not have been thrown so this assertion should pass.'
            );
        }
    }

    /**
     * @dataProvider providerDevelopmentModeToggle
     * @param bool $development_mode
     */
    public function testTrackHandlesApiServerUnavailability(bool $development_mode): void
    {
        if ($development_mode) {
            $this->expectException(ServerException::class);
            $this->expectExceptionMessageMatches('/500 Internal Server Error/');
        }

        $mock = new MockHandler([
            new \GuzzleHttp\Psr7\Response(500),
        ]);

        $handlerStack = HandlerStack::create($mock);
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'development_mode' => $development_mode,
            'client' => new Client(['handler' => $handlerStack])
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();

        $metrics->track($request, $response);

        if (!$development_mode) {
            $this->assertTrue(
                true,
                'When not in development mode, exceptions should not have been thrown so this assertion should pass.'
            );
        }
    }

    public function testConstructPayload(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $this->metrics->constructPayload($request, $response);

        $this->assertSame([
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
        $this->assertRegExp(
            '/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})\+(\d{2}:\d{2})/',
            $payload_entry['startedDateTime'],
            'startedDateTime was not in a format matching `2019-12-19T01:17:51+00:00`.'
        );

        $this->assertIsFloat($payload_entry['time']);
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

        $this->assertSame([
            ['name' => 'cache-control', 'value' => 'no-cache, private'],
            ['name' => 'content-type', 'value' => 'application/json'],
            ['name' => 'x-ratelimit-limit', 'value' => 60],
            ['name' => 'x-ratelimit-remaining', 'value' => 58]
        ], $payload_response['headers']);

        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
        ], json_decode($payload_response['content']['text'], true));

        $this->assertSame($response->headers->get('Content-Length', 0), $payload_response['content']['size']);
        $this->assertSame($response->headers->get('Content-Type'), $payload_response['content']['mimeType']);
    }

    public function testConstructPayloadWithNonJsonResponse(): void
    {
        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS);
        $response = $this->getMockTextResponse();
        $payload = $this->metrics->constructPayload($request, $response);

        $payload_response = $payload['request']['log']['entries'][0]['response'];
        $this->assertSame(200, $payload_response['status']);
        $this->assertSame('OK', $payload_response['statusText']);
        $this->assertSame('OK COMPUTER', $payload_response['content']['text']);
        $this->assertSame(11, $payload_response['content']['size']);
        $this->assertSame('text/plain', $payload_response['content']['mimeType']);
    }

    public function testConstructPayloadWithUploadFileInRequest(): void
    {
        $request = $this->getMockRequest([], self::MOCK_POST_PARAMS, self::MOCK_FILES_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $this->metrics->constructPayload($request, $response);

        $params = $payload['request']['log']['entries'][0]['request']['postData']['params'];
        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world'],
            [
                'name' => 'testfileparam',
                'value' => file_get_contents(self::MOCK_FILES_PARAMS['testfileparam']['tmp_name']),
                'fileName' => 'owlbert',
                'contentType' => 'image/png'
            ]
        ], $params);
    }

    public function testConstructPayloadShouldThrowErrorIfGroupFunctionDoesNotReturnExpectedPayload(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/did not return an array with an id present/');

        $request = \Mockery::mock(Request::class);
        $response = \Mockery::mock(JsonResponse::class);

        (new Metrics('fakeApiKey', TestHandlerReturnsNoData::class))->constructPayload($request, $response);
    }

    public function testConstructPayloadShouldThrowErrorIfGroupFunctionReturnsAnEmptyId(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/must not return an empty id/');

        $request = \Mockery::mock(Request::class);
        $response = \Mockery::mock(JsonResponse::class);

        (new Metrics('fakeApiKey', TestHandlerReturnsEmptyId::class))->constructPayload($request, $response);
    }

    public function testProcessRequestShouldFilterOutItemsInBlacklist(): void
    {
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'blacklist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload($request, $response);

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

    public function testProcessRequestShouldFilterOnlyItemsInWhitelist(): void
    {
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'whitelist' => ['val', 'password']
        ]);

        $request = $this->getMockRequest(self::MOCK_QUERY_PARAMS, self::MOCK_POST_PARAMS);
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload($request, $response);

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

    public function testProcessResponseShouldFilterOutItemsInBlacklist(): void
    {
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'blacklist' => ['value']
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload($request, $response);

        $content = $payload['request']['log']['entries'][0]['response']['content'];

        $this->assertSame([
            ['name' => 'password'],
            ['name' => 'apiKey']
        ], json_decode($content['text'], true));
    }

    public function testProcessResponseShouldFilterOnlyItemsInWhitelist(): void
    {
        $metrics = new Metrics('fakeApiKey', $this->group_handler, [
            'whitelist' => ['value']
        ]);

        $request = $this->getMockRequest();
        $response = $this->getMockJsonResponse();
        $payload = $metrics->constructPayload($request, $response);

        $content = $payload['request']['log']['entries'][0]['response']['content'];

        $this->assertSame([
            ['value' => '123456'],
            ['value' => 'abcdef']
        ], json_decode($content['text'], true));
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
        $response = \Mockery::mock(JsonResponse::class, [
            'getData' => [
                ['name' => 'password', 'value' => '123456'],
                ['name' => 'apiKey', 'value' => 'abcdef'],
            ],
            'getStatusCode' => 200,
        ]);

        $response->headers = \Mockery::mock(HeaderBag::class, [
            'all' => self::MOCK_RESPONSE_HEADERS
        ]);

        $response->headers->shouldReceive('get')->withArgs(['Content-Length', 0])->andReturn(33);
        $response->headers->shouldReceive('get')->withArgs(['Content-Type'])->andReturn('application/json');

        return $response;
    }

    private function getMockTextResponse(): Response
    {
        $response = \Mockery::mock(Response::class, [
            'getContent' => 'OK COMPUTER',
            'getStatusCode' => 200,
        ]);

        $response->headers = \Mockery::mock(HeaderBag::class, [
            'all' => self::MOCK_RESPONSE_HEADERS
        ]);

        $response->headers->shouldReceive('get')->withArgs(['Content-Length', 0])->andReturn(11);
        $response->headers->shouldReceive('get')->withArgs(['Content-Type'])->andReturn('text/plain');

        return $response;
    }

    public function providerDevelopmentModeToggle(): array
    {
        return [
            'development mode on' => [true],
            'development mode off' => [false],
        ];
    }
}
