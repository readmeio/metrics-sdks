.PHONY: start stop test
.DEFAULT_GOAL := help
.SILENT: server.pid

start: server.pid ## Start the local test server

server.pid:
	{ node test/server.js & echo $$! > $@; }

stop: server.pid ## Stop the local test server
	kill `cat $<` && rm $<

test: start ## Run all SDK tests
	cd packages/node; npm test
	cd packages/php; composer test
	make stop

help: ## Display this help menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
