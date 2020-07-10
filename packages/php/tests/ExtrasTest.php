<?php
namespace ReadMe\Tests;

class ExtrasTest extends \PHPUnit\Framework\TestCase
{
    public function testProviderInComposerExtrasMatchesExposedProvider(): void
    {
        $composer = file_get_contents(__DIR__ . '/../composer.json');
        $composer = json_decode($composer);

        $providers = $composer->extra->laravel->providers;
        $this->assertCount(1, $providers);

        $provider = current($providers);
        $this->assertTrue(class_exists($provider));
    }
}
