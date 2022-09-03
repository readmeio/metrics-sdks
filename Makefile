.PHONY: help

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

cleanup:
	@docker-compose down

cleanup-failure:
	@docker-compose down
	exit 1

##
## .NET
##
test-metrics-dotnet: ## Run Metrics tests against the .NET SDK
	EXAMPLE_SERVER="dotnet examples/net6.0/out/net6.0.dll" npm run test:integration-metrics

test-webhooks-dotnet: ## Run webhooks tests against the .NET SDK
	EXAMPLE_SERVER="dotnet examples/net6.0-webhook/out/net6.0-webhook.dll" npm run test:integration-webhooks

##
## Node
##

test-metrics-node-express: ## Run Metrics tests against the Node SDK + Express
	EXAMPLE_SERVER="node ./packages/node/examples/express/index.js" npm run test:integration-metrics

test-webhooks-node-express: ## Run webhooks tests against the Node SDK + Express
	EXAMPLE_SERVER="node ./packages/node/examples/express/webhook.js" npm run test:integration-webhooks

test-metrics-node-fastify: ## Run Metrics tests against the Node SDK + Fastify
	EXAMPLE_SERVER="node ./packages/node/examples/fastify/index.js" npm run test:integration-metrics

test-metrics-node-hapi: ## Run Metrics tests against the Node SDK + hapi
	docker-compose up --build --detach integration_node_hapi
	npm run test:integration-metrics || make cleanup-failure
	@make cleanup

##
## PHP
##

test-metrics-php-laravel: ## Run Metrics tests against the PHP SDK + Laravel
	docker-compose up --build --detach integration_php_laravel
	SUPPORTS_MULTIPART=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-php-laravel: ## Run webhooks tests against the PHP SDK + Laravel
	docker-compose up --detach integration_php_laravel
	SUPPORTS_MULTIPART=true npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

##
## Python
##

test-metrics-python-django: ## Run Metrics tests against the Python SDK + Django
	EXAMPLE_SERVER="python3 packages/python/examples/metrics_django/manage.py runserver" npm run test:integration-metrics

test-metrics-python-flask: ## Run Metrics tests against the Python SDK + Flask
	EXAMPLE_SERVER="python3 packages/python/examples/flask/app.py" npm run test:integration-metrics

test-webhooks-python-flask: ## Run webhooks tests against the Python SDK + Flask
	EXAMPLE_SERVER="python3 packages/python/examples/flask/webhooks.py" npm run test:integration-webhooks
