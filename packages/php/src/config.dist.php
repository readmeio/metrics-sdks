<?php

return [
    /**
     * Your ReadMe API key. You can find this within your project configuration
     * on https://dash.readme.io/.
     */
    'api_key' => 'YOUR README API KEY',

    /**
     * This is a grouping callback that's run for every metric sent to ReadMe,
     * and is a way for you to group metrics against a specific user. This class
     * must implement `ReadMe\Handler`.
     */
    'group_handler' => App\Handler\ReadMe::class,

    /**
     * Since ReadMe doesn't want to take your API down if you happen to be
     * unable to send metrics to us, development mode is enabled by default and
     * will do two things:
     *
     *  - Make all API requests asynchronously.
     *  - Silence all possible errors in transit.
     *
     * While you are still setting up and testing your integration, we recommend
     * enabling this option so you can see any possible error that may be
     * present in your payload before you deploy to production.
     */
    'development_mode' => true,

    /**
     * An array of keys from your API requests and responses that you wish to
     * blacklist from sending to the metrics service. If this option has data in
     * it, the whitelist below will be ignored.
     *
     * Note that this does not support dot-notation, so only top-level keys can
     * be blacklisted.
     */
    'blacklist' => [],

    /**
     * An array of values from your API requests and responses that you only
     * wish to send to the metrics service.
     *
     * Note that this does not support dot-notation, so only top-level keys can
     * be whitelisted.
     */
    'whitelist' => [],
];
