<?php

namespace ReadMe\Tests;

use ReadMe\Webhooks;
use ReadMe\MetricsException;

class WebhooksTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @group verify
     */
    public function testVerify(): void
    {
        $body = ['email' => 'marc@readme.io'];
        $secret = 'docs4dayz';
        $time = floor(microtime(true) * 1000);
        $unsigned = $time . '.' . json_encode($body);
        $signature = 't=' . $time . ',v0=' . hash_hmac('sha256', $unsigned, $secret);

        $verifiedBody = Webhooks::verify($body, $signature, $secret);
        $this->assertSame($body, $verifiedBody);
    }

    /**
     * @group verify
     */
    public function testVerifyFailsIfSignatureIsInvalid(): void
    {
        $this->expectException(MetricsException::class);
        $this->expectExceptionMessage('Invalid Signature');

        $body = ['email' => 'marc@readme.io'];
        $secret = 'docs4dayz';
        $time = floor(microtime(true) * 1000);
        $unsigned = $time . json_encode($body);
        $signature = 't=' . $time . ',v0=' . hash_hmac('sha256', $unsigned, 'invalidsecret');

        Webhooks::verify($body, $signature, $secret);
    }

    /**
     * @group verify
     */
    public function testVerifyFailsIfTimestampIsTooOld(): void
    {
        $this->expectException(MetricsException::class);
        $this->expectExceptionMessage('Expired Signature');

        $body = ['email' => 'marc@readme.io'];
        $secret = 'docs4dayz';
        $time = strtotime('-1 hour') * 1000;
        $unsigned = $time . json_encode($body);
        $signature = 't=' . $time . ',v0=' . hash_hmac('sha256', $unsigned, $secret);

        Webhooks::verify($body, $signature, $secret);
    }

    /**
     * @group verify
     */
    public function testVerifyFailsIfSignatureIsMissing(): void
    {
        $this->expectException(MetricsException::class);
        $this->expectExceptionMessage('Missing Signature');

        $body = ['email' => 'marc@readme.io'];
        $secret = 'docs4dayz';
        $signature = '';

        Webhooks::verify($body, $signature, $secret);
    }
}
