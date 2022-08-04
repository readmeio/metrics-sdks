---
title: .NET Setup
slug: net-setup
category: 5f7cefc76b6e5e04c3a4c74c
---

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

## Overview
If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

* Add the `Readme.Metrics` [NuGet](https://www.nuget.org/) package to your API server and integrate the middleware.
* The .NET SDK sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
* ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data. Additionally, if your users log into your API documentation we'll show them logs of the requests they made!

## ASP.NET Core Integration

1. Install the `Readme.Metrics` NuGet package using [Visual Studio or VS Code](https://docs.microsoft.com/en-us/nuget/install-nuget-client-tools) or the following command:

```bash
dotnet add package Readme.Metrics
```

2. Find the file that creates your `app`. This is often in a `Startup.cs` or `Program.cs` file depending on your version of .NET, and is located in your root directory. Find the where your `app` is created, and add the following line before the routing is enabled. For full details on each option, read more about the [Group Object](#group-object).

```asp
app.Use(async (context, next) =>
{
    HttpRequest req = context.Request;

    context.Items["apiKey"] = <Extract API users API key from the request>
    context.Items["label"] = <Extract API users display name from the request>
    context.Items["email"] = <Extract API users email address from the request>

    await next();
});
```

3. Add the logging middleware to your API server. This will be added immediately after your custom middleware from step 2.

```asp
app.UseMiddleware<Readme.Metrics>();
```

4. Locate `appsettings.json` in the root directory of your Application. Add the following JSON to your configuration and fill in any applicable values. For full details on each option read more about the [ReadMe Object in appsettings.json](https://docs.readme.com/docs/readme-object-in-appsettingsjson).

```json
"readme": {
    "apiKey": "<Your Readme API Key>",
    "options": {
        "allowList": [ "<Any parameters you want allowed in your log. See docs>" ],
        "denyList": [ "<Any parameters you want removed from your log. See docs>"],
        "development": true, // Where to bucket your data, development or production
        "baseLogUrl": "https://example.readme.io" // Your ReadMe website's base url. For now, make sure to use the readme.io domain or your custom subdomain.
    }
}
```

For a full example take a look at our example projects:

* [.NET Core 3.1](https://github.com/readmeio/metrics-sdks-dotnet/blob/04987ee32bcdcd0339736bc645475d05df5237ee/ReadmeMetricsAPI3/Startup.cs#L33-L45)
* [.NET Core 5](https://github.com/readmeio/metrics-sdks-dotnet/blob/04987ee32bcdcd0339736bc645475d05df5237ee/ReadmeMetricsAPI5/Startup.cs#L33-L45)
* [.NET Core 6](https://github.com/readmeio/metrics-sdks-dotnet/blob/04987ee32bcdcd0339736bc645475d05df5237ee/ReadmeMetricsAPI6/Program.cs#L15-L27)

## ASP.NET Core Middleware Reference

### Group Object

Before assigning the Readme.Metrics middleware you should assign custom middleware to extract certain grouping parameters, as seen in step 2 of the ASP.NET Core Integration. The grouping parameters includes three values: apiKey, label and email. While only apiKey is required, we recommend providing all three values to get the most out of the metrics dashboard.

| Field | Type | Description |
| :--- | :--- | :--- |
| apiKey | string | **Required** API Key used to make the request. Note that this is different from the `readmeAPIKey` described above and should be a value from your API that is unique to each of your users, not part of ReadMe's API. |
| label | string | This will be the users' display name in the API Metrics Dashboard, as it's much easier to remember a name than an API key. |
| email | string | Email of the user that is making the call. |

#### Example

```asp
app.Use(async (context, next) =>
{
    HttpRequest req = context.Request;

    context.Items["apiKey"] = <Extract API users API key from the request>
    context.Items["label"] = <Extract API users display name from the request>
    context.Items["email"] = <Extract API users email address from the request>

    await next();
});
```

### ReadMe Object in appsettings.json

The ASP.NET Core middleware extracts the following parameters from `appsettings.json` file:

| Parameter | Description |
| :--- | :--- |
| `readmeAPIKey` | **Required** The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication). |
| `options` | Additional options. You can read more under [Options Object](#options-object). |

#### Options Object

This is an optional object used to restrict traffic being sent to readme server based on given values in allowList or denyList arrays.

| Option | Type | Description |
| :--- | :--- | :--- |
| `denyList` | Array of strings | An array of parameter names that will be redacted from the query parameters, request body (when JSON or form-encoded), response body (when JSON) and headers. For nested request parameters use dot notation (e.g. a.b.c to redact the field `c` within `{ a: { b: { c: 'foo' }}}`). |
| `allowList` | Array of strings | If included, `denyList` will be ignored and all parameters but those in this list will be redacted.
| `development` | bool | Defaults to `false`. When `true`, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers. |
| `baseLogUrl` | string | This value is used when building the `x-documentation-url` header (see docs below). It is your ReadMe documentation's base URL (e.g. `https://example.readme.io`). If not provided, we will make one API call a day to determine your base URL (more info in [Documentation URL](https://docs.readme.com/docs/net-setup#documentation-url).<br /><br />**Note:** .readme.com will not work. Make sure to use .readme.io, or your custom hostname. |

#### Example

```json
{
    "apiKey": "abcd123",
    "options": {
        "denyList": ["password", "secret"],
        "development": true,
        "baseLogUrl": "https://example.readme.io"
    }
}
```

### Documentation URL

With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Make sure to supply a `baseLogUrl` option into your readme settings, which should evaluate to the public-facing URL of your ReadMe project.

### Troubleshooting

1. If you have the `development` flag set in your configuration, you can only view these logs on your dashboard (`https://dash.readme.com/project/{your_project}/v1.0/overview` with your subdomain instead of `{your_project}`) by clicking the gear icon in the top right and toggling on "Development Data".
2. If you're still having issues, [write into support](https://docs.readme.com/guides/docs/contact-support) with the following information:
    - The version of .NET you are using.
    - The value of the `x-documentation-url` header that is returned from calls to your API, or the GUID generated for your log.
    - Additionally, it would be useful to include:
        - Any other config values you are using.
        - The Method, URL, Query Parameters, Request Body and Headers of the API call you are trying to log.
        - The response of the API call to the metrics server (i.e. the value of `response` on [this line](https://github.com/readmeio/metrics-sdks-dotnet/blob/d849f12d33277870f846c974bf0eeed27788f3d8/Readme/HarJsonTranslationLogics/ReadmeApiCaller.cs#L30)).
