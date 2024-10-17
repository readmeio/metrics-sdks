.PHONY: help

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

cleanup:
	@docker compose down

cleanup-failure:
	@docker compose down
	exit 1

##
## .NET
##
test-metrics-dotnet: ## Run Metrics tests against the .NET SDK
	docker compose up --build --detach integration_dotnet_metrics_v6.0
	sleep 5
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-dotnet: ## Run webhooks tests against the .NET SDK
	docker compose up --build --detach integration_dotnet_webhooks_v6.0
	SUPPORTS_HASHING=true npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

##
## Node
##

test-metrics-node-express: ## Run Metrics tests against the Node SDK + Express
	docker compose up --build --detach integration_node_express
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-node-express: ## Run webhooks tests against the Node SDK + Express
	docker compose up --build --detach integration_node_express
	npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

test-metrics-node-fastify: ## Run Metrics tests against the Node SDK + Fastify
	docker compose up --build --detach integration_node_fastify
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-metrics-node-hapi: ## Run Metrics tests against the Node SDK + hapi
	docker compose up --build --detach integration_node_hapi
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

##
## PHP
##

test-metrics-php-laravel: ## Run Metrics tests against the PHP SDK + Laravel
	docker compose up --build --detach integration_php_laravel
	SUPPORTS_HASHING=true SUPPORTS_MULTIPART=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-php-laravel: ## Run webhooks tests against the PHP SDK + Laravel
	docker compose up --detach integration_php_laravel
	SUPPORTS_HASHING=true SUPPORTS_MULTIPART=true npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

##
## Python
##

test-metrics-python-django-wsgi: ## Run Metrics tests against the Python SDK + Django
	docker compose up --build --detach integration_metrics_python_django_wsgi
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-metrics-python-django-asgi: ## Run Metrics tests against the Python SDK + Django
	docker compose up --build --detach integration_metrics_python_django_asgi
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-metrics-python-flask: ## Run Metrics tests against the Python SDK + Flask
	docker compose up --build --detach integration_python_flask_metrics
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-python-flask: ## Run webhooks tests against the Python SDK + Flask
	docker compose up --build --detach integration_python_flask_webhooks
	SUPPORTS_HASHING=true npm run test:integration-webhooks || make cleanup-failure
	@make cleanup

##
## Ruby
##

# For some reason the Rails server kept failing without the `sleep 5` and we
# ran out of patience to try and figure out why. You can see our frustrated
# attempts to fix it over here: https://github.com/readmeio/metrics-sdks/pull/590
# This is the only thing that works consistently. It's not great but it'll do.

test-metrics-ruby-rails: ## Run Metrics tests against the Ruby SDK + Rails
	docker compose up --build --detach integration_ruby_rails
	sleep 5
	SUPPORTS_HASHING=true npm run test:integration-metrics || make cleanup-failure
	@make cleanup

test-webhooks-ruby-rails: ## Run webhooks tests against the Ruby SDK + Rails
	docker compose up --build --detach integration_ruby_rails
	sleep 5
	SUPPORTS_HASHING=true npm run test:integration-webhooks || make cleanup-failure
	@make cleanup
