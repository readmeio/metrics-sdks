<?php

namespace ReadMe;

class ServiceProvider extends \Illuminate\Support\ServiceProvider
{
    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/config.dist.php' => config_path('readme.php'),
        ], 'config');

        $this->publishes([
            __DIR__ . '/handler.dist.php' => app_path('Handler/ReadMe.php'),
        ]);
    }
}
