<?php

namespace ReadMe;

class Middleware
{
    /** @var Metrics */
    private $metrics;

    /**
     * @psalm-suppress UndefinedFunction `config()` is a Laravel global that's present when this class is used.
     */
    public function __construct()
    {
        $this->metrics = new Metrics(
            config('readme.api_key'),
            config('readme.group_handler'),
            [
                'development_mode' => config('readme.development_mode', false),
                'blacklist' => config('readme.blacklist', []),
                'whitelist' => config('readme.whitelist', []),
                'base_log_url' => config('readme.base_log_url'),
            ]
        );
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     * @throws \ReadMe\MetricsException
     */
    public function handle($request, \Closure $next)
    {
        $response = $next($request);

        $this->metrics->track($request, $response);

        return $response;
    }
}
