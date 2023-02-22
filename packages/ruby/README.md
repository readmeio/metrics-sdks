# ReadMe Metrics

<p align="center">
  <img src="https://user-images.githubusercontent.com/33762/182927634-2aebeb46-c215-4ac3-9e98-61f931e33583.png" />
</p>

<p align="center">
  Track usage of your API and troubleshoot issues faster.
</p>

<p align="center">
  <a href="https://rubygems.org/gems/readme-metrics"><img src="https://img.shields.io/gem/v/readme-metrics.svg?style=for-the-badge" alt="Latest release"></a>
  <a href="https://github.com/readmeio/metrics-sdks"><img src="https://img.shields.io/github/actions/workflow/status/readmeio/metrics-sdks/ruby.yml?branch=main&style=for-the-badge" alt="Build status"></a>
</p>

With [ReadMe's Metrics API](https://readme.com/metrics) your team can get deep insights into your API's usage. If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com). Here's an overview of how the integration works:

- You add the ReadMe middleware to your Rails application.
- The middleware sends to ReadMe the request and response objects that your Express server generates each time a user makes a request to your API. The entire objects are sent, unless you allow or deny keys.
- ReadMe extracts information to display in Metrics, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

```bash
gem "readme-metrics"
```

**For more information on setup, check out our [integration documentation](https://docs.readme.com/docs/ruby-api-metrics-set-up).**

> 🚧 Any Issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.
