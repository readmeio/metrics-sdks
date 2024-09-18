<?php

namespace ReadMe\Tests\HAR;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use ReadMe\Metrics;
use ReadMe\HAR\Payload;
use ReadMe\Tests\Fixtures\TestHandler;
use ReadMe\Tests\Fixtures\TestHandlerReturnsDeprecatedIDField;
use ReadMe\Tests\Fixtures\TestHandlerReturnsEmptyId;
use ReadMe\Tests\Fixtures\TestHandlerReturnsEmptyAPIKey;
use ReadMe\Tests\Fixtures\TestHandlerReturnsNoData;
use Symfony\Component\HttpFoundation\Response;

class PayloadTest extends \PHPUnit\Framework\TestCase
{
    private const MOCK_RESPONSE_HEADERS = [
        'cache-control' => 'no-cache, private',
        'x-ratelimit-limit' => 60,
        'x-ratelimit-remaining' => 58,

        // `HeaderBag` sets its own date header but since we don't care what it actually is we're
        // overriding it here for our mocks.
        'date' => 'date.now()'
    ];

    /**
     * @example ?arr%5B1%5D=3&val=1
     */
    private const MOCK_QUERY_PARAMS = [
        'val' => '1',
        'arr' => [1 => '3'],
    ];

    private const MOCK_POST_PARAMS = [
        'password' => '123456',
        'apiKey' => 'abcdef',
        'another' => 'Hello world',
        'buster' => [1234, 5678]
    ];

    private const MOCK_FILES_PARAMS = [
        'testfileparam' => [
            'name' => 'owlbert.png',
            'type' => 'application/octet-stream',
            'tmp_name' => __DIR__ . '/../datasets/owlbert.png',
            'error' => 0,
            'size' => 400
        ]
    ];

    private Metrics $metrics;
    private Payload $payload;

    /** @var class-string|string */
    private $group_handler = TestHandler::class;

    private string $readme_api_key = 'mockReadMeApiKey';

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
        $this->payload = new Payload($this->metrics);
    }

    /**
     * @group getHARCreatorVersion
     */
    public function testGetHARCreatorVersion(): void
    {
        $this->assertNotEmpty(Payload::getHARCreatorVersion());
    }

    /**
     * @group group_handler
     */
    public function testCreateWithAPIKey(): void
    {
        $request = $this->getMockRequest(content_type: 'application/json', method: 'get');
        $response = $this->getMockJsonResponse();
        $har = $this->payload->create('fake-uuid', $request, $response);

        $this->assertArrayHasKey('id', $har['group']);
    }

    /**
     * @group group_handler
     */
    public function testCreateWithDeprecatedIDField(): void
    {
        $request = $this->getMockRequest(content_type: 'application/json', method: 'get');
        $response = $this->getMockJsonResponse();
        $metrics = new Metrics($this->readme_api_key, TestHandlerReturnsDeprecatedIDField::class);
        $har = (new Payload($metrics))->create('fake-uuid', $request, $response);

        $this->assertArrayHasKey('id', $har['group']);
    }

    /**
     * @group create
     */
    public function testCreate(): void
    {
        $request = $this->getMockRequest(
            content_type: 'application/json',
            method: 'get',
            payload: self::MOCK_QUERY_PARAMS,
        );

        $response = $this->getMockJsonResponse();
        $har = $this->payload->create('fake-uuid', $request, $response);

        $this->assertSame('fake-uuid', $har['_id']);

        $this->assertEqualsCanonicalizing([
            'id' => 'sha512-UrMmjaetxGbu6QkwzYAH9h4c1dzTNIy3CV1lBuHSb0TNlTmrgUUzTRINiCPah7ObWnOiqVXUlVjQD14gblqlPA=='
                . '?7890',
            'label' => 'username',
            'email' => 'email@example.com'
        ], $har['group']);

        $this->assertSame('8.8.8.8', $har['clientIPAddress']);
        $this->assertFalse($har['development']);

        $this->assertSame('readme-metrics (php)', $har['request']['log']['creator']['name']);
        $this->assertIsString($har['request']['log']['creator']['version']);
        $this->assertSame(Payload::getHARCreatorVersion(), $har['request']['log']['creator']['comment']);

        $this->assertCount(1, $har['request']['log']['entries']);

        $har_entry = $har['request']['log']['entries'][0];
        $this->assertSame('https://api.example.com/v1/user', $har_entry['pageref']);
        $this->assertMatchesRegularExpression(
            '/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{3})?Z/',
            $har_entry['startedDateTime'],
            'startedDateTime was not in a format matching `2022-08-17T17:12:13Z`.'
        );

        $this->assertIsInt($har_entry['time']);
        $this->assertIsNumeric($har_entry['time']);
        $this->assertGreaterThan(0, $har_entry['time']);

        // Assert that the request was set up properly.
        $har_request = $har_entry['request'];
        $this->assertSame('GET', $har_request['method']);
        $this->assertSame('https://api.example.com/v1/user?arr%5B1%5D=3&val=1', $har_request['url']);
        $this->assertSame('HTTP/1.1', $har_request['httpVersion']);

        $this->assertEquals(-1, $har_request['headersSize']);
        $this->assertSame([
            ['name' => 'host', 'value' => 'api.example.com'],
            ['name' => 'user-agent', 'value' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...'],
            ['name' => 'accept', 'value' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
            ['name' => 'accept-language', 'value' => 'en-us,en;q=0.5'],
            ['name' => 'accept-charset', 'value' => 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'],
            ['name' => 'content-type', 'value' => 'application/json'],
        ], $har_request['headers']);

        $this->assertSame([
            ['name' => 'val', 'value' => '1'],
            ['name' => 'arr', 'value' => json_encode([1 => '3'])]
        ], $har_request['queryString']);

        $this->assertArrayNotHasKey(
            'postData',
            $har_request,
            'postData should not be here because there is none for this GET request'
        );

        // Assert that the response was set up properly.
        $har_response = $har_entry['response'];
        $this->assertSame(200, $har_response['status']);
        $this->assertSame('OK', $har_response['statusText']);

        $this->assertEqualsCanonicalizing(array_merge(
            $this->formatMockHeadersForHAR(self::MOCK_RESPONSE_HEADERS),
            [
                ['name' => 'content-type', 'value' => 'application/json'],
            ]
        ), $har_response['headers']);

        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
        ], json_decode($har_response['content']['text'], true));

        $this->assertEquals(73, $har_response['content']['size']);
        $this->assertSame($response->headers->get('Content-Type'), $har_response['content']['mimeType']);
    }

    /**
     * @group create
     */
    public function testCreateWithCookies(): void
    {
        $request = $this->getMockRequest(
            content_type: 'application/json',
            method: 'post',
            payload: self::MOCK_QUERY_PARAMS,
            cookies: [
                'pizza' => 'large',
                'buster' => 'asleep'
            ]
        );

        $response = $this->getMockJsonResponse();
        $har = $this->payload->create('fake-uuid', $request, $response);

        $this->assertCount(1, $har['request']['log']['entries']);

        $har_entry = $har['request']['log']['entries'][0];
        $har_request = $har_entry['request'];
        $this->assertSame([
            ['name' => 'pizza', 'value' => 'large'],
            ['name' => 'buster', 'value' => 'asleep']
        ], $har_request['cookies']);
    }

    /**
     * @group create
     */
    public function testCreateWithNonJsonResponse(): void
    {
        $request = $this->getMockRequest(content_type: 'application/json', method: 'get');
        $response = $this->getMockTextResponse();
        $har = $this->payload->create('fake-uuid', $request, $response);

        $har_response = $har['request']['log']['entries'][0]['response'];

        $this->assertSame(200, $har_response['status']);
        $this->assertSame('OK', $har_response['statusText']);

        $this->assertEqualsCanonicalizing(array_merge(
            $this->formatMockHeadersForHAR(self::MOCK_RESPONSE_HEADERS),
            [
                ['name' => 'content-type', 'value' => 'text/plain'],
                ['name' => 'content-length', 'value' => '11'],
            ]
        ), $har_response['headers']);

        $this->assertSame('OK COMPUTER', $har_response['content']['text']);
        $this->assertSame(11, $har_response['content']['size']);
        $this->assertSame('text/plain', $har_response['content']['mimeType']);
    }

    /**
     * @group create
     */
    public function testCreateWithPOSTPayloadWithQueryParameters(): void
    {
        $request = $this->getMockRequest(
            url: 'http://api.example.com/v1/user/?arr%5B1%5D=3&val=1',
            content_type: 'application/json',
            method: 'post',
            payload: self::MOCK_POST_PARAMS
        );

        $response = $this->getMockTextResponse();
        $har = $this->payload->create('fake-uuid', $request, $response);

        $har_request = $har['request']['log']['entries'][0]['request'];

        $this->assertEquals(-1, $har_request['bodySize']);

        $this->assertSame('http://api.example.com/v1/user?arr%5B1%5D=3&val=1', $har_request['url']);
        $this->assertSame([
            ['name' => 'arr', 'value' => json_encode([1 => '3'])],
            ['name' => 'val', 'value' => '1']
        ], $har_request['queryString']);

        $this->assertSame([
            'mimeType' => 'application/json',
            'text' => json_encode(self::MOCK_POST_PARAMS)
        ], $har_request['postData']);
    }

    /**
     * @group create
     */
    public function testCreateWithFormEncodedRequest(): void
    {
        $request = $this->getMockRequest(
            content_type: 'application/x-www-form-urlencoded',
            method: 'post',
            payload: self::MOCK_POST_PARAMS,
        );

        $response = $this->getMockJsonResponse();
        $payload = $this->payload->create('fake-uuid', $request, $response);

        $har_request = $payload['request']['log']['entries'][0]['request'];

        $this->assertSame('POST', $har_request['method']);
        $this->assertIsInt(
            array_search(
                ['name' => 'content-type', 'value' => 'application/x-www-form-urlencoded'],
                $har_request['headers']
            )
        );

        $this->assertSame('application/x-www-form-urlencoded', $har_request['postData']['mimeType']);
        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world'],
            ['name' => 'buster', 'value' => '[1234,5678]']
        ], $har_request['postData']['params']);

        $this->assertArrayNotHasKey('text', $har_request['postData']);
    }

    /**
     * @group create
     */
    public function testCreateWithMultipartRequest(): void
    {
        $request = $this->getMockRequest(
            content_type: 'multipart/form-data',
            method: 'post',
            payload: self::MOCK_POST_PARAMS,
        );

        $response = $this->getMockJsonResponse();
        $payload = $this->payload->create('fake-uuid', $request, $response);

        $har_request = $payload['request']['log']['entries'][0]['request'];

        $this->assertSame('POST', $har_request['method']);
        $this->assertIsInt(
            array_search(
                ['name' => 'content-type', 'value' => 'multipart/form-data'],
                $har_request['headers']
            )
        );

        $this->assertSame('multipart/form-data', $har_request['postData']['mimeType']);
        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world'],
            ['name' => 'buster', 'value' => '[1234,5678]']
        ], $har_request['postData']['params']);

        $this->assertArrayNotHasKey('text', $har_request['postData']);
    }

    /**
     * @group create
     */
    public function testCreateWithMultipartRequestWithFiles(): void
    {
        $request = $this->getMockRequest(
            content_type: 'multipart/form-data',
            method: 'post',
            payload: self::MOCK_POST_PARAMS,
            files: self::MOCK_FILES_PARAMS
        );

        $response = $this->getMockJsonResponse();
        $payload = $this->payload->create('fake-uuid', $request, $response);

        $har_request = $payload['request']['log']['entries'][0]['request'];

        $this->assertSame('POST', $har_request['method']);
        $this->assertIsInt(
            array_search(
                ['name' => 'content-type', 'value' => 'multipart/form-data'],
                $har_request['headers']
            )
        );

        $this->assertSame('multipart/form-data', $har_request['postData']['mimeType']);
        $this->assertSame([
            ['name' => 'password', 'value' => '123456'],
            ['name' => 'apiKey', 'value' => 'abcdef'],
            ['name' => 'another', 'value' => 'Hello world'],
            ['name' => 'buster', 'value' => '[1234,5678]'],
            [
                'name' => 'testfileparam',
                'value' => file_get_contents(__DIR__ . '/../datasets/owlbert.dataurl.txt'),
                'fileName' => 'owlbert.png',
                'contentType' => 'image/png'
            ]
        ], $har_request['postData']['params']);

        $this->assertArrayNotHasKey('text', $har_request['postData']);
    }

    /**
     * @group errorHandling
     */
    public function testCreateShouldThrowErrorIfGroupFunctionDoesNotReturnExpectedPayload(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/did not return an array with an api_key present/');

        $request = $this->getMockRequest(content_type: 'application/json', method: 'post');
        $response = $this->getMockJsonResponse();

        $metrics = new Metrics($this->readme_api_key, TestHandlerReturnsNoData::class);
        (new Payload($metrics))->create('fake-uuid', $request, $response);
    }

    /**
     * @group errorHandling
     */
    public function testCreateShouldThrowErrorIfGroupFunctionReturnsAnEmptyAPIKey(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/must not return an empty api_key/');

        $request = $this->getMockRequest(content_type: 'application/json', method: 'post');
        $response = $this->getMockJsonResponse();

        $metrics = new Metrics($this->readme_api_key, TestHandlerReturnsEmptyAPIKey::class);
        (new Payload($metrics))->create('fake-uuid', $request, $response);
    }

    /**
     * @group errorHandling
     */
    public function testCreateShouldThrowErrorIfGroupFunctionReturnsAnEmptyId(): void
    {
        $this->expectException(\TypeError::class);
        $this->expectExceptionMessageMatches('/must not return an empty id/');

        $request = $this->getMockRequest(content_type: 'application/json', method: 'post');
        $response = $this->getMockJsonResponse();

        $metrics = new Metrics($this->readme_api_key, TestHandlerReturnsEmptyId::class);
        (new Payload($metrics))->create('fake-uuid', $request, $response);
    }

    /**
     * @group processRequest
     * @dataProvider providerRequestFiltering
     */
    public function testProcessRequestFiltering(array $options, array $postDataText): void
    {
        $request = $this->getMockRequest(
            url: 'https://api.example.com/v1/user/?arr%5B1%5D=3&val=1',
            content_type: 'application/json',
            method: 'post',
            payload: self::MOCK_POST_PARAMS
        );

        $response = $this->getMockJsonResponse();

        $metrics = new Metrics($this->readme_api_key, $this->group_handler, $options);
        $har = (new Payload($metrics))->create('fake-uuid', $request, $response);

        $har_request = $har['request']['log']['entries'][0]['request'];

        // Denylist should not affect $_GET params.
        $this->assertSame([
            ['name' => 'arr', 'value' => json_encode([1 => '3'])],
            ['name' => 'val', 'value' => '1']
        ], $har_request['queryString']);

        $this->assertSame([
            'mimeType' => 'application/json',
            'text' => json_encode($postDataText)
        ], $har_request['postData']);
    }

    /**
     * @group processResponse
     * @dataProvider providerResponseFiltering
     */
    public function testProcessResponseFiltering(array $options, array $responseText): void
    {
        $request = $this->getMockRequest(content_type: 'application/json', method: 'post');
        $response = $this->getMockJsonResponse();

        $metrics = new Metrics($this->readme_api_key, $this->group_handler, $options);
        $har = (new Payload($metrics))->create('fake-uuid', $request, $response);

        $har_response = $har['request']['log']['entries'][0]['response'];

        $this->assertSame(json_encode($responseText), $har_response['content']['text']);
    }

    private function getMockRequest(
        string $content_type,
        string $method,
        array $payload = [],
        array $files = [],
        array $cookies = [],
        string $url = 'https://api.example.com/v1/user/'
    ): Request {
        // We only need to encode JSON payloads into `$request->getContent()` if we're sending
        // requests that can deliver payloads (read: non-GET requests).
        $content = null;
        if (strtoupper($method) !== 'GET' && $content_type === 'application/json') {
            $content = json_encode($payload);
            $payload = [];
        }

        $request = new \Illuminate\Http\Request();
        return $request->createFromBase(
            \Symfony\Component\HttpFoundation\Request::create(
                $url,
                $method,
                $payload,
                $cookies,
                $files,
                [
                    'CONTENT_TYPE' => $content_type,
                    'CACHE-CONTROL' => 'max-age=0',
                    'REMOTE_ADDR' => '8.8.8.8',
                    'HTTP_USER_AGENT' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) ...',
                ],
                $content
            )
        );

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
                'Content-Length' => strlen('OK COMPUTER')
            ])
        );
    }

    private function formatMockHeadersForHAR(array $headers)
    {
        return array_map(function (string $k, string $v) {
            return [
                'name' => $k,
                'value' => $v
            ];
        }, array_keys($headers), array_values($headers));
    }

    public function providerDevelopmentModeToggle(): array
    {
        return [
            'development mode on' => [true],
            'development mode off' => [false],
        ];
    }

    public function providerRequestFiltering(): array
    {
        return [
            'denylist' => [
                ['denylist' => ['val', 'password']],
                ['apiKey' => 'abcdef', 'another' => 'Hello world', 'buster' => [1234, 5678]]
            ],
            'allowlist' => [
                ['allowlist' => ['val', 'password']],
                ['password' => '123456']
            ],
            'blacklist (deprecated)' => [
                ['blacklist' => ['val', 'password']],
                ['apiKey' => 'abcdef', 'another' => 'Hello world', 'buster' => [1234, 5678]]
            ],
            'whitelist (deprecated)' => [
                ['whitelist' => ['val', 'password']],
                ['password' => '123456']
            ]
        ];
    }

    public function providerResponseFiltering(): array
    {
        return [
            'denylist' => [
                ['denylist' => ['value']],
                [['name' => 'password'], ['name' => 'apiKey']]
            ],
            'allowlist' => [
                ['allowlist' => ['value']],
                [['value' => '123456'], ['value' => 'abcdef']]
            ],
            'blacklist (deprecated)' => [
                ['blacklist' => ['value']],
                [['name' => 'password'], ['name' => 'apiKey']]
            ],
            'whitelist (deprecated)' => [
                ['whitelist' => ['value']],
                [['value' => '123456'], ['value' => 'abcdef']]
            ]
        ];
    }
}
