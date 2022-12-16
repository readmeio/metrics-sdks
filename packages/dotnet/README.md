# ReadMe Metrics

![ReadMe Metrics logo](https://user-images.githubusercontent.com/33762/182927634-2aebeb46-c215-4ac3-9e98-61f931e33583.png)

Track usage of your API and troubleshoot issues faster.

[![Latest release](https://img.shields.io/nuget/v/ReadMe.Metrics.svg?style=for-the-badge)](https://www.nuget.org/packages/ReadMe.Metrics/) [![Build status](https://img.shields.io/github/actions/workflow/status/readmeio/metrics-sdks/dotnet.yml?branch=main&style=for-the-badge)](https://github.com/readmeio/metrics-sdks)

With [ReadMe's Metrics API](https://readme.com/metrics) your team can get deep insights into your API's usage. If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com). Here's an overview of how the integration works:

- Add the `ReadMe.Metrics` [NuGet](https://www.nuget.org/) package to your API server and integrate the middleware.
- The .NET SDK sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
- ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data. Additionally, if your users log into your API documentation we'll show them logs of the requests they made!

```
dotnet add package ReadMe.Metrics
```

- [ASP.NET Core Integration](https://docs.readme.com/docs/net-setup#aspnet-core-integration)
- [ASP.NET Core Middleware Reference](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs#generic-nodejs-integration)

> 🚧 Any Issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.
