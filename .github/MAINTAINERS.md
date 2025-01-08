# ReadMe Metrics SDK Maintainers Handbook

<img src="https://user-images.githubusercontent.com/33762/188260890-1c499342-8110-4b2a-85ab-f77d57ac3279.png" align="right" />

## 📦 Release Management - issuing a new release

### Node

For publishing a new version of the Node SDK, you can handle this with Lerna by running `npm run publish` from the root directory. It will handle everything for you related to publishing the package.

### PHP

To publish a new version of the PHP package, after you mirror the codebase with split.sh, check out the [PHP mirror](https://github.com/readmeio/metrics-sdks-php) and create a new tag there. Once the tag is pushed back into Git, Packagist will automatically pick it up.

See [tag based release management](#tag-based-release-management).

### Ruby

To publish a new version of the Ruby [package](https://rubygems.org/gems/readme-metrics/) bump the package version in `version.rb`, and then run `gem build readme-metrics` and `gem push <BUILT_GEM>`.

### Python

If you're not a maintainer of `readme-metrics` on [PyPI](https://pypi.org), [register for an account](https://pypi.org/account/register/), enable two-factor auth on your [account settings](https://pypi.org/manage/account/), and ask someone to add you as a maintainer.

You may also want to create a `.pypirc` file in your home directory ([example](https://gist.github.com/RyanGWU82/893fb63e6d182f90ef227fd1fd4e9da5)). `.pypirc` now uses API keys so you will need to generate one. See PyPI's [help guide](https://pypi.org/help/) on how to generate it.

To publish a new version:

1. `cd packages/python`
2. Update `version` in `readme_metrics/__init__.py`

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(__version__ = \)\"\([^\"]*\)\"/\1\"$NEW_VERSION\"/" readme_metrics/__init__.py; unset NEW_VERSION
```

1. Commit the changes to `readme_metrics/__init__.py`.
2. `rm dist/*`
3. Enter the virtualenv for this package, as documented [here](/packages/python/CONTRIBUTING.md)
4. `python3 setup.py sdist bdist_wheel`
   - If you get errors about `invalid command 'bdist_wheel'`, install the wheel package: `pip3 install wheel`
5. `python3 -m twine upload dist/*`
   - If you get errors about `twine` not being installed, install it with `pip3 install twine`.
   - If you get errors about `setuptools` not being installed, install it with `pip3 install setuptools`.
   - On the first run you'll be asked to log into PyPi, so if you don't have access to `readme-metrics` there ask someone to hook you up with access.

### .NET

If you're not a maintainer of [`ReadMe.Metrics`](https://www.nuget.org/packages/ReadMe.Metrics/) on [NuGet](https://www.nuget.org/), [register for a Microsoft account by going through this flow](https://www.nuget.org/users/account/LogOn), enable two-factor auth on your [account settings](https://account.live.com/proofs/manage/additional), and ask someone to add you as a maintainer. Also ensure that you have [.Net CLI](https://dotnet.microsoft.com/en-us/download) installed.

To publish a new version:

1. `cd packages/dotnet/ReadMe`
2. Update `<Version>` in `ReadMe.csproj`

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(<Version.*>\)[^<>]*\(<\/Version.*\)/\1$NEW_VERSION\2/" *.csproj; unset NEW_VERSION
```

3. Update `version` in `ConstValues.cs`

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(Version = \)\"\([^\"]*\)\"/\1\"$NEW_VERSION\"/" ConstValues.cs; unset NEW_VERSION
```

4. `dotnet pack`
5. Create an API key by following the instructions [here](https://docs.microsoft.com/en-us/nuget/nuget-org/publish-a-package#create-api-keys)
6. Publish!

```sh
dotnet nuget push ./bin/Release/ReadMe.Metrics.<version>.nupkg --api-key <apiKey> --source https://api.nuget.org/v3/index.json
```

### Tag-based release management

> ℹ️ Some package managers require you to publish from tagged releases and cannot be released from a monorepo structure. This section is only relevant for those packages (currently PHP only)

In order to prep a new release we need to split the current `main` up to the individual mirrors for each SDK package.

Why do this? Well for some of our packages the management systems in which they're delivered require a tag-based release and we can't tag individual directories so we need to split that package out to its own repository. We use git subtrees to manage these mirrors.

This automatically happens via github action on pushes to main. We use [Deploy Keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) to handle this for us.

#### Adding a new mirror

To add a new package (and a new mirrored repository), you have to generate a new SSH key, upload the public key to the mirrored repo and add the private key to the parent repo's secrets.

1. Generating a new SSH key:

```sh
ssh-keygen -t ed25519 -C "$(git config user.email)" -f /tmp/new-ssh-key -N ""
```

This will output a new key, associated with your email address to /tmp/new-ssh-key. The new key will have no passphrase because it will be used in a github action environment with no way to provide the passphrase.

2. Upload this to our 1password account
3. Add the public key portion to the "Deploy Keys" section in the mirror e.g. https://github.com/readmeio/metrics-sdks-php/settings/keys/new. Make sure you check "Allow write access" so it can push new code.
4. Add the private key portion to the "Actions secrets" section of the monorepo: https://github.com/readmeio/metrics-sdks/settings/secrets/actions/new
5. Update `./bin/split.sh` and `./.github/workflows/split-monorepo.yml` to include the new mirror and SSH key.
6. Update the main README.md to include information about the new package.

### Kong Plugin

This does not require a release. Users will simply copy the `kong` directory within `packages/kong-plugin` into their Kong image [see this guide](https://docs.konghq.com/gateway/latest/plugin-development/get-started/deploy/).

In the future:

- We will build a Docker image for the plugin and release it to the Kong Community plugins site.
- We will offer a zip file with the plugin code.

## 🧑‍🔬 Integration Testing

We have an integration testing layer for both Metrics and webhooks to ensure that the different SDKs, and how they may be used within a variety of HTTP frameworks, are compliant to the Metrics API and all behave the same given certain parameters.

### 📊 Metrics

To run integration testing on a new Metrics SDK or an implementation of that SDK you must do the following:

- [ ] The HTTP server must look for an `README_API_KEY` environment variable and exit with an exit code of `1` if it does not exist.
  - This variable must be used to authenticate against the Metrics service.
- [ ] Ensure that the the SDK is running in an HTTP server that is bound to `http://0.0.0.0:8000`.
  - The port should also be able to be optionally overridden with a `PORT` environment variable but port 8000 **must** be the default.
- [ ] The SDK configuration must **not** have buffering enabled, or if it does its buffer limit is 1. If a request comes through to the HTTP server, the Metrics SDK must immediately send that to Metrics.
- [ ] The SDK, and HTTP server, must allow our production Metrics server to be overridden with a `README_METRICS_SERVER` environment variable.
- [ ] The HTTP server should have a Metrics SDK installed that responds with the following identification object for the user making the request:

```json
{
  "apiKey": "owlbert-api-key",
  "label": "Owlbert",
  "email": "owlbert@example.com"
}
```

- [ ] The HTTP server should have a listener on `GET /` that responds with a 200 status code, and a JSON response body of `{ "message": "hello world" }`.
- [ ] The HTTP server should have a listener on `POST /` that will be provided with a JSON body of `{ "user": { "email": "dom@readme.io" } }` which should be included in the Metrics payload. This should respond with a 200 status code and an empty body.
- [ ] You must create a Docker container for your HTTP server in `test/integrations/` under the SDK language you're using.
  - See those directories for some existing examples.
- [ ] You must add your Docker container into `docker-compose.yml`.
  - See `docker-compose.yml` for existing examples.
- [ ] You must set up a new target in the root `Makefile` for running your HTTP server.
  - See the root `Makefile` for existing examples.

Once you have written an SDK server implementation that complies with the above requirements you can run the integration test suite with `make`:

```sh
make test-metrics-{language}-{framework}
```

If all this is working locally you should add this new `make` target into the appropriate Github CI workflow in `.github/workflows/.

Great success!

### 📞 Webhooks

To run integration testing on a new webhooks implementation you must do the following:

- [ ] The HTTP server must look for an `README_API_KEY` environment variable and exit with an exit code of `1` if it does not exist.
  - This variable must be used to authenticate against the Metrics service.
- [ ] Ensure that the the SDK is running in an HTTP server that is bound to `http://0.0.0.0:8000`.
  - The port should also be able to be optionally overridden with a `PORT` environment variable but port 8000 **must** be the default.

* [ ] The HTTP server should have a listener on `POST /webhook` that must verify the incoming signature from the `readme-signature` request header. It must validate the following cases:
  - If the signature is **missing**, it should return with a 401 status code, and a JSON response body of `{ "error": "Missing Signature" }`
  - If the signature is **invalid**, it should return with a 401 status code, and a JSON response body of `{ "error": "Invalid Signature" }`
  - If the signature has **expired**, it should return with a 401 status code, and a JSON response body of `{ "error": "Expired Signature" }`
  - If the signature passes validation, it should respond with a 200 status code, and a JSON response body of `{ "petstore_auth": "default-key", "basic_auth": { user: "user", pass: "pass" } }`
* [ ] The HTTP server should use the `README_API_KEY` environment variable as the secret to validate the Webhook signature.

- [ ] You must create a Docker container for your HTTP server in `test/integrations/` under the SDK language you're using.
  - See those directories for some existing examples.
  - If you can, try to keep webhooks and Metrics applications in the same stack so we don't have demo apps only to demo webhooks or the same but for Metrics. The less overall code we need to maintain in these applications the better.
- [ ] You must add your Docker container into `docker-compose.yml`.
  - See `docker-compose.yml` for existing examples.
- [ ] You must set up a new target in the root `Makefile` for running your HTTP server.
  - See the root `Makefile` for existing examples.

Once you have written an SDK server implementation that complies with the above requirements you can run the integration test suite with `make`:

```sh
make test-webhooks-{language}-{framework}
```

If all this is working locally you should add this new `make` target into the appropriate Github CI workflow in `.github/workflows/.

Great success!

### 🔍 Debugging

If you're having trouble getting your Metrics, or webhooks, HTTP servers running you can do the following:

1. Boot up the Docker container for the service you created:

```sh
docker-compose build integration_LANGUAGE_FRAMEWORK && docker-compose up integration_LANGUAGE_FRAMEWORK
```

2. Boot up this code that will act as a mock Metrics server. If you configured your SDK server properly it will automaticaly call this when fed requests.

```js
import http from 'node:http';

http
  .createServer((req, res) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      console.log(`[${new Date().toISOString()}]`, JSON.parse(data));
      res.end();
    });
  })
  .listen(8001, '0.0.0.0');
```

3. Test that this is all working now by accessing http://localhost:8000 in your browser. You should see logs in your `docker-compose up` terminal and the logs from the mock Metrics server.
4. Kill the mock Metrics server now that you've verified your SDK is able to call http://localhost:8001.
5. Run the test suite with Mocha:

```js
npx mocha test/integration-metrics.test.js
```
