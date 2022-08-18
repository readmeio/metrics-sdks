test-metrics-php-laravel:
	EXAMPLE_SERVER="php packages/php/examples/laravel/artisan serve" npm run test:integration-metrics

test-webhooks-php-laravel:
	EXAMPLE_SERVER="php packages/php/examples/laravel/artisan serve" npm run test:integration-webhooks
