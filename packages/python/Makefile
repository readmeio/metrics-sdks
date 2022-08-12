install: # Install all dependencies
	pip3 install -r requirements.txt

lint: ## Run code standard checks
	pylint --output-format=colorized readme_metrics/
	black --check .

lint-fix: ## Run code formatting checks
	black .

test: ## Run unit tests
	pytest

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
