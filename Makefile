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
	docker-compose up --build --detach integration_dotnet_metrics_v6.0
	npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-dotnet: ## Run webhooks tests against the .NET SDK
	docker-compose up --build --detach integration_dotnet_webhooks_v6.0
	npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

##
## Node
##

test-metrics-node-express: ## Run Metrics tests against the Node SDK + Express
	docker-compose up --build --detach integration_node_express
	npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-node-express: ## Run webhooks tests against the Node SDK + Express
	docker-compose up --build --detach integration_node_express
	npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

test-metrics-node-fastify: ## Run Metrics tests against the Node SDK + Fastify
	docker-compose up --build --detach integration_node_fastify
	npm run test:integration-metrics || make cleanup-failure
	@make cleanup

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
	docker-compose up --build --detach integration_python_flask_metrics
	HAS_HTTP_QUIRKS=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-python-flask: ## Run webhooks tests against the Python SDK + Flask
	docker-compose up --build --detach integration_python_flask_webhooks
	npm run test:integration-webhooks || make cleanup-failure
	@make cleanup
