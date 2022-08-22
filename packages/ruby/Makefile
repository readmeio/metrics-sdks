install: ## Install all dependencies
	bundle

lint: ## Run code standard checks
	bundle exec rubocop

lint-fix: ## Attempt to automatically fix any code standard violations
	bundle exec rubocop --auto-correct

test: ## Run unit tests
	rake spec

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
