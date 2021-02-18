<?php

namespace ReadMe\Tests;

class ConfigTest extends \PHPUnit\Framework\TestCase
{
    public function testConfigFileHasExpectedData(): void
    {
        $config = require_once(__DIR__ . '/../src/config.dist.php');

        $this->assertSame([
            'api_key',
            'group_handler',
            'development_mode',
            'denylist',
            'allowlist',
            'base_log_url'
        ], array_keys($config));
    }
}
