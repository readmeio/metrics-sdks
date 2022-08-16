build: clean ## Build the library (and run code standard checks)
	dotnet build ReadMe/

clean: ## Clean out the currently built library
	rm -rf ReadMe/bin/ ReadMe/obj

package: clean ## Build the library for publishing
	dotnet pack ReadMe/

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
