.PHONY: help test
API_KEY ?= $(shell bash -c 'read -p "ReadMe API Key: " api_key; echo $$api_key')

build: ## Build the library dist
	npm run build

install: ## Install all dependencies
	npm ci

lint: ## Run code standard checks
	npx eslint .

lint-fix: ## Attempt to automatically fix any code standard violations
	npx eslint --fix .

serve-metrics-express: ## Start the local Express server to test Metrics
	README_API_KEY=$(API_KEY) npm run --prefix=examples/express start:metrics

serve-metrics-fastify: ## Start the local Fastify server to test Metrics
	README_API_KEY=$(API_KEY) npm run --prefix=examples/fastify start:metrics

serve-metrics-hapi: ## Start the local hapi server to test Metrics
	README_API_KEY=$(API_KEY) npm run --prefix=examples/hapi start:metrics

serve-webhooks-express: ## Start the local Express erver to test webhooks
	README_API_KEY=$(API_KEY) npm run --prefix=examples/express start:webhooks

test: ## Run unit tests
	npm run test

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
