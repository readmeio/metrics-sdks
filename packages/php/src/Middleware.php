<?php

namespace ReadMe;

class Middleware
{
    private Metrics $metrics;

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
     * @throws \ReadMe\MetricsException
     */
    public function handle(\Illuminate\Http\Request $request, \Closure $next): mixed
    {
        $response = $next($request);

        $this->metrics->track($request, $response);

        return $response;
    }
}
