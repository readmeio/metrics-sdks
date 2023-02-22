---
title: PHP (Laravel) Setup
slug: sending-logs-to-readme-with-php-laravel
category: 62292aea889520008ed0113b
---

> 🚀 Upgrading to v2.0?
>
> Please see our [upgrade path documentation](#section--how-can-i-upgrade-to-v2-0-).

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

## Overview

If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

<!-- TODO: we should rename these options! -->
<!-- alex ignore blacklist whitelist -->

- You add the ReadMe middleware to your [Laravel](https://laravel.com/) application.
- The middleware sends to ReadMe the response object that your Laravel application generates each time a user makes a request to your API. The entire response is sent, unless you blacklist or whitelist keys.
- ReadMe populates Metrics with this information, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

## Steps

> ℹ️
>
> Note these steps assume you are working in [PHP](https://www.php.net/) and the [Laravel](https://laravel.com/) web framework

1. From the directory of your company's API codebase, run the following command in your command line to install the `readme/metrics` package from [Packagist](https://packagist.org/packages/readme/metrics):

```bash
composer require readme/metrics
```

2. Install the configuration file for `readme/metrics`, named `readme.php`, into your application with the following command:

```bash
php artisan vendor:publish --provider="ReadMe\ServiceProvider"
```

3. Locate the "kernel" file for your API routing layer, this will typically be `app/Http/Kernel.php`, and search for a `api` group under `$middlewareGroups`. Install the `\Readme\Middleware` Service Provider into that array. It should look something like the following:

```php app/Http/Kernel.php
/**
 * The application's route middleware groups.
 *
 * @var array
 */
protected $middlewareGroups = [
    'web' => [
        // Any web middleware you may have set up.
    ],

    'api' => [
        \ReadMe\Middleware::class,
        // Any other API middleware you may have set up.
    ],
];
```

4. Configure the middleware in the newly created configuration file from step 2: `config/readme.php`:
   - Change `YOUR README API KEY` to <<user>>. If you're currently logged into these docs, you can see your ReadMe API key in the preceding sentence; otherwise, you can find it at `https://dash.readme.com/project/YOUR PROJECT/api-key`.
5. Modify the `constructGroup` function in the newly created `app/Handler/ReadMe.php` handler to return data specific to your API. See [Identfying the API Caller](#section-identifying-the-api-caller) for detailed instructions.

## Identifying the API Caller

There are three pieces of data you can use to identify the user making the API call. (If your Laravel request object doesn't have all this information, we recommend adding it via additional middleware prior to this.) We recommend supplying all three to get the most insights about your API.

```php app/Handler/Readme.php
<?php
namespace App\Handler;

use Illuminate\Http\Request;

class ReadMe implements \ReadMe\Handler
{
    public static function constructGroup(Request $request): array
    {
        $user = $request->user();
        if (!$user) {
            return [
                'api_key' => session()->getId()
            ];
        }

        return [
            'api_key' => $user->id,
            'label' => $user->name,
            'email' => $user->email
        ];
    }
}
```

<!-- prettier-ignore-start -->
| Field | Usage |
| :--- | :--- |
| `api_key` | **Required** API Key used to make the request.
| `label` | This will be used to identify the user on ReadMe, since it's much easier to remember a name than a unique identifier.
| `email` | Email of the person that is making the call.
<!-- prettier-ignore-end -->

## Configuration Options

There are a few configurable options in `config/readme.php` that let you change how logs are sent to ReadMe.

<!-- prettier-ignore-start -->
| Option | Type | Description |
| :--- | :--- | :--- |
| `development_mode` | bool | When disabled, `development_mode` will make all API requests asynchronously as well as silencing all possible errors in transit. This defaults to `true`, and you should change it to false before deploying your integration to production. |
| `blacklist` | Array of strings | An array of keys from your API requests and responses that you wish to blacklist from sending to ReadMe. If this option is present, it will be favored over the `whitelist` option below. |
| `whitelist` | Array of strings | An array of keys from your API requests and responses that you only wish to send to ReadMe. |
| `base_log_url` | string | This is the base URL for your ReadMe project. Normally this would be `https://projectName.readme.io` or `https://docs.yourdomain.com`, however if this value is not supplied, a request to the ReadMe API will be made once a day to retrieve it. This data is cached into `$COMPOSER_HOME/cache`. |
<!-- prettier-ignore-end -->

> ⚠️
>
> `blacklist` and `whitelist` do not support support dot-notation so only top-level keys can be specified.

## Sample Applications

- [Laravel](https://github.com/readmeio/metrics-sdks/tree/main/packages/php/examples/laravel)

## FAQ

### How can I upgrade to v2.0?

1. Copy `config/readme.php` to `config\readme.php.backup`.
2. Update the SDK:

```bash
composer update readme/metrics
```

3. Re-run the config publishing step from our installation instructions:

```bash
php artisan vendor:publish --provider="ReadMe\ServiceProvider"
```

This will install the new config and the new handler class.

4. Open up `config\readme.php.backup` and copy your `api_key`, `development_mode`, `blacklist`, and `whitelist` configs over to `config\readme.php`.
5. Open up `app\Handler\Readme.php` and copy the contents of the old group function from `config\readme.php.backup` into the `constructGroup` function.
