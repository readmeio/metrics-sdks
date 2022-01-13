
# Overview
The Metrics API gives you access to usage data for your API and hub, so you can make more data-driven decisions around your platform and API roadmap. Many of the metrics that you can get using this API are also available as visualizations directly in ReadMe in our Metrics charts.

# Asp.Net Core Library Integration (3 steps)
## 1. Installation

### In Visual Studio
There are two ways to install the **Readme.Metrics** nuget package in your Asp.Net Core Web API / Asp.Net Core Web Application:-

- By command

    Open Package Manager Console by Tools => NuGet Package Manager => Package Manager Console and run below command

    ```c#
    Install-Package ReadMe.Metrics
    ```
- By GUI
    
    Right click on project => Manage Nuget Packages => Browse. Here search Readme.Metrics package and install

### In Visual Studio Code  
Open new terminal and run below command

```c#
dotnet add package ReadMe.Metrics
```

## 2. Integration

- ## In .Net 6
    Open **Program.cs** file and add below code under **var app = builder.Build();** line

    ```c#
    app.Use(async (context, next) =>
    {
        HttpRequest req = context.Request;
        //You can extract apikey from request header by key like authentication, x-api-key as
        // req.Headers["key"];
        //Or extract apikey from request body form or x-www-form-urlencoded by key as
        // req.Form["key"];

        context.Items["apiKey"] = req.Headers["key"];
        context.Items["label"] = "username / company name";
        context.Items["email"] = "email";
        await next();
    });
    app.UseMiddleware<ReadmeMetricsLibrary.RequestResponseLogger>();
    ```
- ## In .Net 5 / .Net 3.1
    Locate and open **Startup.cs** file in your Asp.Net Core Web API / Asp.Net Core Web Application (Usually in root directory). You will see several using namespace statements at the top. Add the following statement:

    ```c# 
    using readmedotnetcore;
    using Microsoft.AspNetCore.Http;
    ```

    Find Configure method and add below code at start:

    ```c#
    //Below middleware create items for group values
    //(apiKey, label, email)

    app.Use(async (context, next) =>
    {
        HttpRequest req = context.Request;

        //You can extract apikey from request header by key like authentication, x-api-key as
        // req.Headers["key"];

        //Or extract apikey from request body form or x-www-form-urlencoded by key as
        // req.Form["key"];

        context.Items["apiKey"] = req.Headers["key"];
        context.Items["label"] = "username / company name";
        context.Items["email"] = "email";

        await next();
    });
    //Below middleware will invoke metrics library
    app.UseMiddleware<RequestResponseLogger>();
    ```

## 3. Global Configuration
 Locate the file **appsettings.json** in the root directory of Asp.Net Core Web API / Asp.Net Core Web Application. Copy and paste below code inside root curly brace. Fill properties with valid values.

```json 
"readme": {
    "apiKey": "Readme API Key",
    "options": {
        //"allowList" : ["username","address", "age"] means that library will extract values from headers,query strings and body whose key is given in allowList. When allowList is given, denyList will be ignored
        "allowList": [ ],
        //"denyList" : ["password","secret"] means that library will not extract values from headers,query strings and body whose key is given in denyList.
        "denyList": [ ],
        "development": true,
        "baseLogUrl": "https://example.readme.com"
        }
    }
```


