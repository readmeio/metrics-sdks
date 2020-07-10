<?php
namespace ReadMe;

class ServiceProvider extends \Illuminate\Support\ServiceProvider
{
    /**
     * @psalm-suppress UndefinedFunction `config_path()` is a Laravel global that's present when this class is used.
     * @return void
     */
    public function boot()
    {
        $this->publishes([
            __DIR__ . '/config.dist.php' => config_path('readme.php'),
        ], 'config');

        $this->publishes([
            __DIR__ . '/handler.dist.php' => $path = app_path('Handler/ReadMe.php'),
        ]);
    }
}
