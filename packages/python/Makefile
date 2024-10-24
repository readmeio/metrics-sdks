.PHONY: help test
API_KEY ?= $(shell bash -c 'read -p "ReadMe API Key: " api_key; echo $$api_key')

install: # Install all dependencies
	pip3 install -r requirements.txt
	pip3 install -r requirements.dev.txt

lint: ## Run code standard checks
	pylint --output-format=colorized examples/ readme_metrics/ --ignore=venv
	black --check .

lint-fix: ## Run code formatting checks
	black .

serve-metrics-django-wsgi: ## Start the local Django WSGI server to test Metrics
	README_API_KEY=$(API_KEY) SERVER_TYPE="wsgi" python3 examples/metrics_django/manage.py runserver

serve-metrics-django-asgi: ## Start the local Django ASGI server to test Metrics
	README_API_KEY=$(API_KEY) SERVER_TYPE="asgi" python3 examples/metrics_django/manage.py runserver

serve-metrics-flask: ## Start the local Flask server to test Metrics
	README_API_KEY=$(API_KEY) python3 examples/flask/app.py

serve-webhooks-flask: ## Start the local Flask server to test webhooks
	README_API_KEY=$(API_KEY) python3 examples/flask/webhooks.py

test: ## Run unit tests
	pytest

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
