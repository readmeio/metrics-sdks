.PHONY: help test
API_KEY ?= $(shell bash -c 'read -p "ReadMe API Key: " api_key; echo $$api_key')

install: # Install all dependencies
	composer install

lint: ## Run code standard checks
	./vendor/bin/phpcs -p -s src/ tests/ examples/

lint-fix: ## Attempt to automatically fix any code standard violations
	./vendor/bin/phpcbf src/ tests/ examples/

serve-metrics-laravel: ## Start the local Laravel server to test Metrics
	README_API_KEY=$(API_KEY) php examples/laravel/artisan serve

serve-webhooks-laravel: ## Start the local Laravel server to test webhooks
	README_API_KEY=$(API_KEY) php examples/laravel/artisan serve

static-analysis: ## Run static analysis checks
	./vendor/bin/psalm

taint-analysis: ## Run static analysis taint checks
	./vendor/bin/psalm --taint-analysis

test: ## Run unit tests
	./vendor/bin/phpunit

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
