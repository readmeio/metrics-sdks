# Maintainers Guide

## Prepping a new release

In order to prep a new release we need to split the current `main` up to the individual mirrors for each SDK package.

Why do this? Well for some of our packages the management systems in which they're delivered require a tag-based release and we can't tag individual directories so we need to split that package out to its own repository. We use git subtrees to manage these mirrors. To push the subtrees from your local machine, you can run the following:

```
./bin/split.sh
```

This automatically happens via github action on pushes to main. We use [Deploy Keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) to handle this for us.

### Adding a new mirror

> ℹ️ You only need to do this if the new package cannot be published from tagged releases or a monorepo structure (like PHP with Packagist).

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

### Issuing a new release

#### Node

For publishing a new version of the Node SDK, you can handle this with Lerna by running `npm run publish` from the root directory. It will handle everything for you related to publishing the package.

#### PHP

To publish a new version of the PHP package, after you mirror the codebase with splitsh, check out the [PHP mirror](https://github.com/readmeio/metrics-sdks-php) and create a new tag there. Once the tag is pushed back into Git, Packagist will automatically pick it up.

#### Ruby

To publish a new version of the Ruby [package](https://rubygems.org/gems/readme-metrics/) bump the package version in `version.rb`, and then run `gem build readme-metrics` and `gem push <BUILT_GEM>`.

#### Python

If you're not a maintainer of `readme-metrics` on [PyPI](https://pypi.org), [register for an account](https://pypi.org/account/register/), enable two-factor auth on your [account settings](https://pypi.org/manage/account/), and ask someone to add you as a maintainer.

You may also want to create a `.pypirc` file in your home directory ([example](https://gist.github.com/RyanGWU82/893fb63e6d182f90ef227fd1fd4e9da5)).

To publish a new version:

1. `cd packages/python`
2. Update `version` in `readme_metrics/__init__.py`
<!-- Please forgive me for this -->

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(__version__ = \)\"\([^\"]*\)\"/\1\"$NEW_VERSION\"/" readme_metrics/__init__.py; unset NEW_VERSION
```

3. Commit the changes to `readme_metrics/__init__.py` (and mirror that change).
4. `rm dist/*`
5. `python3 setup.py sdist bdist_wheel`
   - If you get errors about `invalid command 'bdist_wheel'`, install the wheel package: `pip3 install wheel`
6. `python3 -m twine upload dist/*`
   - If you get errors about `twine` not being installed, install it with `pip3 install twine`.
   - On the first run you'll be asked to log into PyPi, so if you don't have access to `readme-metrics` there ask someone to hook you up with access.

#### Dotnet

If you're not a maintainer of [`ReadMe.Metrics`](https://www.nuget.org/packages/ReadMe.Metrics/) on [NuGet](https://www.nuget.org/), [register for a Microsoft account by going through this flow](https://www.nuget.org/users/account/LogOn), enable two-factor auth on your [account settings](https://account.live.com/proofs/manage/additional), and ask someone to add you as a maintainer.

To publish a new version:

1. `cd packages/dotnet/ReadMe`
2. Update `<Version>` in `ReadMe.csproj`
<!-- Please forgive me for this -->

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(<Version.*>\)[^<>]*\(<\/Version.*\)/\1$NEW_VERSION\2/" *.csproj; unset NEW_VERSION
```

3. Update `version` in `ConstValues.cs`
<!-- And for this 🙏 -->

```sh
NEW_VERSION="x.x.x"; sed -i '' "s/\(Version = \)\"\([^\"]*\)\"/\1\"$NEW_VERSION\"/" ConstValues.cs; unset NEW_VERSION
```

<!-- https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package-dotnet-cli#run-the-pack-command -->

4. `dotnet pack`
<!-- https://docs.microsoft.com/en-us/nuget/nuget-org/publish-a-package#command-line -->
5. Create an API key by following the instructions [here](https://docs.microsoft.com/en-us/nuget/nuget-org/publish-a-package#create-api-keys)
6. Publish!

```sh
dotnet nuget push ./bin/Debug/ReadMe.Metrics.<version>.nupkg --api-key <apiKey> --source https://api.nuget.org/v3/index.json
```

## Building an integration test

We have an integration testing layer for both Metrics and Webhooks to ensure the different SDKs are compliant and act the same given certain parameters.

### Metrics

To build a Metrics integration test server, you must write an HTTP server that does the following:

- Looks for an `README_API_KEY` environment variable, and exits with an exit code of 1 if it does not exist.
- Spawns an HTTP server that listens on the `PORT` environment variable, or 4000 if no environment variable exists.
- The HTTP server should have a listener on `GET /` that responds with a 200 status code, and a JSON response body of `{ "message": "hello world" }`
- The HTTP server should have a Metrics SDK installed, that responds with the following identification object for the user making the request:

```json
{
  "apiKey": "owlbert-api-key",
  "label": "Owlbert",
  "email": "owlbert@example.com"
}
```

- The HTTP server should use the `README_API_KEY` environment variable as the API key to authenticate against Metrics.
- The Metrics SDK you are using should accept a `METRICS_SERVER` environment variable which controls where the request data gets sent to.

You can view the Node.js/Express example server here for additional guidance and example: [packages/node/examples/express/index.js](https://github.com/readmeio/metrics-sdks/blob/main/packages/node/examples/express/index.js)

Once you have written a server that complies to the above requirements, you can run the integration test suite from the top level directory with the following command:

```sh
EXAMPLE_SERVER="<command to run your server>" npm run test:integration-metrics
```

`EXAMPLE_SERVER` tells the test how to spawn your server as a child process. So for Node.js/Express, you can run the following:

```sh
EXAMPLE_SERVER="node ./packages/node/examples/express/index.js" npm run test:integration-metrics
```

This should then be configured to run as part of the GitHub Actions CI process, to do this you will need to setup the following:

- a Dockerfile which spins up the required environment to run the test. These are located in `__tests__/integrations` (see [`node.Dockerfile`](https://github.com/readmeio/metrics-sdks/blob/911e972fef596934d6332d258defb9a57b6ed3a0/__tests__/integrations/node.Dockerfile#L28) for an example)
- a block in docker-compose.yml telling Docker how to run your test; including the `EXAMPLE_SERVER` env variable from above (see [`integration_metrics_node_express`](https://github.com/readmeio/metrics-sdks/blob/911e972fef596934d6332d258defb9a57b6ed3a0/docker-compose.yml#L3-L9) for an example)
- an `integration` test block inside the github workflow, which runs the docker-compose service that you just setup (see [`nodejs.yml`](https://github.com/readmeio/metrics-sdks/blob/911e972fef596934d6332d258defb9a57b6ed3a0/.github/workflows/nodejs.yml#L34-L47) for an example)

We do this via docker-compose so that you can test the docker environments locally like so:

```sh
docker-compose run integration_metrics_node_express
```

If this is all setup then you should see these running on push into GitHub.

### Webhooks

To build a Webhooks integration test server, you must write an HTTP server that does the following:

- Looks for an `README_API_KEY` environment variable, and exits with an exit code of 1 if it does not exist.
- Spawns an HTTP server that listens on the `PORT` environment variable, or 4000 if no environment variable exists.
- The HTTP server should have a listener on `POST /webhook` that must verify the incoming signature from the `readme-signature` request header. It must validate the following cases:

  - If the signature is **missing**, it should return with a 401 status code, and a JSON response body of `{ "error": "Missing Signature" }`
  - If the signature is **invalid**, it should return with a 401 status code, and a JSON response body of `{ "error": "Invalid Signature" }`
  - If the signature has **expired**, it should return with a 401 status code, and a JSON response body of `{ "error": "Expired Signature" }`
  - If the signature passes validation, it should respond with a 200 status code, and a JSON response body of `{ "petstore_auth": "default-key", "basic_auth": { user: "user", pass: "pass" } }`

- The HTTP server should use the `README_API_KEY` environment variable as the secret to validate the Webhook signature.

You can view the Node.js/Express example server here for additional guidance and example: [packages/node/examples/express/webhook.js](https://github.com/readmeio/metrics-sdks/blob/main/packages/node/examples/express/webhook.js)

Once you have written a server that complies to the above requirements, you can run the integration test suite from the top level directory with the following command:

```sh
EXAMPLE_SERVER="<command to run your server>" npm run test:integration-webhooks
```

`EXAMPLE_SERVER` tells the test how to spawn your server as a child process. So for Node.js/Express, you can run the following:

```sh
EXAMPLE_SERVER="node ./packages/node/examples/express/webhook.js" npm run test:integration-metrics
```

This should then be configured to run as part of the GitHub Actions CI process, to do this you will need to setup the following:

- a Dockerfile which spins up the required environment to run the test. These are located in `__tests__/integrations` (see [`node.Dockerfile`](https://github.com/readmeio/metrics-sdks/blob/911e972fef596934d6332d258defb9a57b6ed3a0/__tests__/integrations/node.Dockerfile#L28) for an example)
- a block in docker-compose.yml telling Docker how to run your test; including the `EXAMPLE_SERVER` env variable from above (see [`integration_webhooks_node_express`](https://github.com/readmeio/metrics-sdks/blob/4544380a283dfd9c5e24e65c73cbfdb038d2d96b/docker-compose.yml#L11-L17) for an example)
- an `integration` test block inside the github workflow, which runs the docker-compose service that you just setup (see [`nodejs.yml`](https://github.com/readmeio/metrics-sdks/blob/911e972fef596934d6332d258defb9a57b6ed3a0/.github/workflows/nodejs.yml#L34-L47) for an example)

We do this via docker-compose so that you can test the docker environments locally like so:

```sh
docker-compose run integration_webhooks_node_express
```

If this is all setup then you should see these running on push into GitHub.
