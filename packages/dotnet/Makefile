.PHONY: help
API_KEY ?= $(shell bash -c 'read -p "ReadMe API Key: " api_key; echo $$api_key')

build: clean ## Build the library (and run code standard checks)
	dotnet build ReadMe/

clean: ## Clean out the currently built library
	rm -rf ReadMe/bin/ ReadMe/obj

install: ## Install the required dependencies to run .NET applications
	brew install dotnet

package: clean ## Build the library for publishing
	dotnet pack ReadMe/

serve-metrics-dotnet: ## Start the local .NET 6.0 server to test Metrics
	cd examples/net6.0 && README_API_KEY=$(API_KEY) dotnet run

serve-webhooks-dotnet: ## Start the local .NET 6.0 server to test webhooks
	README_API_KEY=$(API_KEY) cd examples/net6.0-webhook && dotnet run

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
