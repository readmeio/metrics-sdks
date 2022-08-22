install: # Install all dependencies
	composer install

lint: ## Run code standard checks
	./vendor/bin/phpcs -p -s src/ tests/ examples/

lint-fix: ## Attempt to automatically fix any code standard violations
	./vendor/bin/phpcbf src/ tests/ examples/

static-analysis: ## Run static analysis checks
	./vendor/bin/psalm

taint-analysis: ## Run static analysis taint checks
	./vendor/bin/psalm --taint-analysis

test: ## Run unit tests
	./vendor/bin/phpunit

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
