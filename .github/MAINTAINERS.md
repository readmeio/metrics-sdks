# Maintainers Guide

## Prepping a new release

In order to prep a new release we need to split the current `main` up to the individual mirrors for each SDK package.

Why do this? Well for some of our packages the management systems in which they're delivered require a tag-based release and we can't tag individual directories so we need to split that package out to its own repository. We use git subtrees to manage these mirrors. To push the subtrees from your local machine, you can run the following:

```
./bin/split.sh
```

This automatically happens via github action on pushes to main. We use [Deploy Keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) to handle this for us.

### Adding a new mirror

To add a new package (and a new mirrored repository), you have to generate a new SSH key, upload the public key to the mirrored repo and add the private key to the parent repo's secrets.

1. Generating a new SSH key:

```sh
ssh-keygen -t ed25519 -C "$(git config user.email)" -f /tmp/new-ssh-key -N ""
```

This will output a new key, associated with your email address to /tmp/new-ssh-key. The new key will have no passphrase because it will be used in a github action environment with no way to provide the passphrase.

2. Upload this to our 1password account
3. Add the public key portion to the "Deploy Keys" section in the mirror e.g. https://github.com/readmeio/metrics-sdks-node/settings/keys/new. Make sure you check "Allow write access" so it can push new code.
4. Add the private key portion to the "Actions secrets" section of the monorepo: https://github.com/readmeio/metrics-sdks/settings/secrets/actions/new
5. Update `./bin/split.sh` and `./.github/workflows/split-monorepo.yml` to include the new mirror and SSH key.
6. Update the main README.md to include information about the new package.

### Issuing a new release

#### Node

For publishing a new version of the Node SDK, you can handle this with Lerna by running `npm run publish` from the root directory. It will handle everything for you related to publishing the package.

#### PHP

To publish a new version of the PHP package, after you mirror the codebase with splitsh, check out the [PHP mirror](https://github.com/readmeio/metrics-sdks-php) and create a new tag there. Once the tag is pushed back into Git, Packagist will automatically pick it up.

#### Ruby

To publish a new version of the Ruby [package](https://rubygems.org/gems/readme-metrics/) bump the package version in `version.rb`, and then run `gem build readme-metrics` and `gem publish <BUILT_GEM>`.

#### Python

If you're not a maintainer of `readme-metrics` on [PyPI](https://pypi.org), [register for an account](https://pypi.org/account/register/), enable two-factor auth on your [account settings](https://pypi.org/manage/account/), and ask someone to add you as a maintainer.

You may also want to create a `.pypirc` file in your home directory ([example](https://gist.github.com/RyanGWU82/893fb63e6d182f90ef227fd1fd4e9da5)).

To publish a new version:

1. `cd packages/python`
2. Update `version` in `readme_metrics/__init__.py`
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
NEW_VERSION="x.x.x"; sed -i '' "s/\(version = \)\"\([^\"]*\)\"/\1\"$NEW_VERSION\"/" ConstValues.cs; unset NEW_VERSION
```

<!-- https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package-dotnet-cli#run-the-pack-command -->

4. `dotnet pack`
<!-- https://docs.microsoft.com/en-us/nuget/nuget-org/publish-a-package#command-line -->
5. Create an API key by following the instructions [here](https://docs.microsoft.com/en-us/nuget/nuget-org/publish-a-package#create-api-keys)
6. Publish!

```sh
dotnet nuget push ./bin/Debug/ReadMe.Metrics.<version>.nupkg --api-key <apiKey> --source https://api.nuget.org/v3/index.json
```
