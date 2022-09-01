.PHONY: help
API_KEY ?= $(shell bash -c 'read -p "ReadMe API Key: " api_key; echo $$api_key')

install: ## Install all dependencies
	bundle

lint: ## Run code standard checks
	bundle exec rubocop

lint-fix: ## Attempt to automatically fix any code standard violations
	bundle exec rubocop --auto-correct

serve-metrics-rails: ## Start the local Express server to test Metrics
	README_API_KEY=$(API_KEY) npm run --prefix=examples/express start:metrics

test: ## Run unit tests
	rake spec

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
