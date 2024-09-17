# ReadMe Metrics + Kong

<p align="center">
  <img src="https://user-images.githubusercontent.com/33762/182927634-2aebeb46-c215-4ac3-9e98-61f931e33583.png" />
</p>

<p align="center">
  Track usage of your API and troubleshoot issues faster.
</p>

With [ReadMe's Metrics API](https://readme.com/metrics) your team can get deep insights into your API's usage. If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com). Here's an overview of how the integration works:

- Install this plugin into your Kong Gateway by copying the `kong` directory into your Kong environment or use the provided Dockerfile. see [this](https://docs.konghq.com/gateway/latest/plugin-development/get-started/deploy/) for details.
- The plugin runs during the log phase of the Kong pipeline and sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private headers using the configuration options.
- ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data.

### 📦 Deploying locally

```bash
# Build kong image with the plugin
docker build -t kong-readme-plugin:latest .
# Run kong with the plugin
curl -Ls https://get.konghq.com/quickstart |  bash -s -- -r "" -i kong-readme-plugin -t latest
# Enable the plugin
curl -isX POST http://localhost:8001/plugins -d name=readme-plugin -d 'config.api_key=<Your API Key>'
```

### 🧑‍🔬 Testing

Requires [pongo](https://github.com/Kong/kong-pongo) to test and develop.

```bash
pongo up
pongo shell
kms

# Check if the plugin is available
curl -s localhost:8001 | jq '.plugins.available_on_server."readme-plugin"'
```

#### Enable for all services

```bash
curl -sX POST http://localhost:8001/plugins -d name=readme-plugin -d 'config.api_key=<Your API Key>' | jq
```

#### Enable for a specific service

```bash
# Add a new service
curl -isX POST http://localhost:8001/services -d name=example_service -d url='http://httpbin.org'

# Associate the custom plugin with the `example_service` service
curl -isX POST http://localhost:8001/services/example_service/plugins -d 'name=readme-plugin' -d "config.queue.max_retry_time=1"

# Add a new route for sending requests through the `example_service` service
curl -iX POST http://localhost:8001/services/example_service/routes -d 'paths[]=/mock' -d name=example_route

# Test
curl -i http://localhost:8000/mock/anything
```

### 🧙 Development tricks

```bash
# Get plugin config
curl -s http://localhost:8001/plugins  | jq '.data | map(select(.name == "readme-plugin")) | first'

# Retrieve the plugin ID
export PLUGIN_ID=$(curl -s http://localhost:8001/plugins  | jq '.data | map(select(.name == "readme-plugin")) | first | .id' | tr -d '"')

# Configure the plugin with your API key
curl -sX PATCH http://localhost:8001/plugins/$PLUGIN_ID -d "config.api_key=<Your API Key>" | jq '.config.api_key'

# Configure `hide_headers`
curl -sX PATCH -H'Content-Type: application/json' http://localhost:8001/plugins/$PLUGIN_ID -d '{"config": {"hide_headers": {"foo": "", "bar": "default"}}}' | jq '.config.hide_headers'

# Configure `id_header`
curl -sX PATCH -H'Content-Type: application/json' http://localhost:8001/plugins/$PLUGIN_ID -d '{"config": {"id_header": "email"}}' | jq '.config.id_header'

# Configure `group_by`
curl -sX PATCH -H'Content-Type: application/json' http://localhost:8001/plugins/$PLUGIN_ID -d '{"config": {"group_by": {"x-user-email": "email", "x-org-name": "label"}}}' | jq '.config.group_by'

# Delete the plugin
curl -sX DELETE http://localhost:8001/plugins/$PLUGIN_ID
```

> 🚧 Any Issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.
