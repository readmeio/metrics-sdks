<?php

namespace ReadMe\Tests;

class HandlerTest extends \PHPUnit\Framework\TestCase
{
    public function testHandlerImplementsCoreHandler(): void
    {
        require_once(__DIR__ . '/../src/handler.dist.php');

        $handler = new \App\Handler\ReadMe();

        $this->assertInstanceOf(\ReadMe\Handler::class, $handler);
    }
}
