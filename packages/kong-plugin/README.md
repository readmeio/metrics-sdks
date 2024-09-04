# ReadMe Metrics + Kong

<p align="center">
  <img src="https://user-images.githubusercontent.com/33762/182927634-2aebeb46-c215-4ac3-9e98-61f931e33583.png" />
</p>

<p align="center">
  Track usage of your API and troubleshoot issues faster.
</p>

With [ReadMe's Metrics API](https://readme.com/metrics) your team can get deep insights into your API's usage. If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com). Here's an overview of how the integration works:

- You add the Cloudflare Worker to your Cloudflare account
- The Cloudflare Worker sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
- ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data.

**For information on how to set it up, check out our [integration documentation](https://docs.readme.com/docs/sending-logs-to-readme-with-cloudflare).**

### testing
```bash
pongo up
pongo shell
kms
# check if the plugin is available
curl -s localhost:8001 | jq '.plugins.available_on_server."readme-plugin"'
```
#### Enable for all services
```bash
curl -i -s -X POST http://localhost:8001/plugins --data name=readme-plugin --data 'config.api_key=<Your API Key>'
```

#### Enable for a specific service route
```bash
#  add a new service
curl -i -s -X POST http://localhost:8001/services --data name=example_service --data url='http://httpbin.org'
# Associate the custom plugin with the example_service service
curl -is -X POST http://localhost:8001/services/example_service/plugins --data 'name=readme-plugin'   -d "config.queue.max_retry_time=1"
# Add a new route for sending requests through the example_service
curl -i -X POST http://localhost:8001/services/example_service/routes --data 'paths[]=/mock' --data name=example_route
# test
curl -i http://localhost:8000/mock/anything
```

### Development tricks
Get plugin config for a route
```bash
curl  http://localhost:8001/plugins  | jq '.data | map(select(.name == "readme-plugin")) | first'
```

```bash
# Configure the plugin with your API key
curl  -X PATCH http://localhost:8001/plugins/6cfe12f1-cbdf-4ffd-8750-617dc4a5199d --data "config.api_key=<Your API Key>" | jq '.config.api_key'
# configure Hide headers
curl -X PATCH -H'Content-Type: application/json' http://localhost:8001/plugins/6cfe12f1-cbdf-4ffd-8750-617dc4a5199d --data '{"config": {"hide_headers": {"foo": "", "bar": "default"}}}' | jq '.config.hide_headers'
```


> 🚧 Any Issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.
