.PHONY: help

test-dotnet-metrics: ## Run metrics tests against the .NET SDK
	EXAMPLE_SERVER="dotnet examples/net6.0/out/net6.0.dll" npm run test:integration-metrics

test-dotnet-webhooks: ## Run webhooks tests against the .NET SDK
	EXAMPLE_SERVER="dotnet examples/net6.0-webhook/out/net6.0-webhook.dll" npm run test:integration-webhooks

test-node-metrics-express: ## Run metrics tests against the Node SDK + Express
	EXAMPLE_SERVER="node ./packages/node/examples/express/index.js" npm run test:integration-metrics

test-node-webhooks-express: ## Run webhooks tests against the Node SDK + Express
	EXAMPLE_SERVER="node ./packages/node/examples/express/webhook.js" npm run test:integration-webhooks

test-node-metrics-fastify: ## Run metrics tests against the Node SDK + Fastify
	EXAMPLE_SERVER="node ./packages/node/examples/fastify/index.js" npm run test:integration-metrics

test-node-metrics-hapi: ## Run metrics tests against the Node SDK + hapi
	EXAMPLE_SERVER="node ./packages/node/examples/hapi/index.js" npm run test:integration-metrics

test-php-metrics-laravel: ## Run metrics tests against the PHP SDK + Laravel
	SUPPORTS_MULTIPART=true EXAMPLE_SERVER="php packages/php/examples/laravel/artisan serve" npm run test:integration-metrics

test-php-webhooks-php-laravel: ## Run webhooks tests against the PHP SDK + Laravel
	EXAMPLE_SERVER="php packages/php/examples/laravel/artisan serve" npm run test:integration-webhooks

test-python-metrics-flask: ## Run Metrics tests against the Python SDK + Flask
	EXAMPLE_SERVER="python3 packages/python/examples/flask/app.py" npm run test:integration-metrics

test-python-webhooks-flask: ## Run webhooks tests against the Python SDK + Flask
	EXAMPLE_SERVER="python3 packages/python/examples/flask/webhooks.py" npm run test:integration-webhooks

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
