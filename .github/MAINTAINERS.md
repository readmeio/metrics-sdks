# Maintainers Guide
## Prepping a new release
In order to prep a new release we need to split the current `main` up to the individual mirrors for each SDK package.

Why do this? Well for some of our packages the management systems in which they're delivered require a tag-based release and we can't tag individual directories so we need to split that package out to its own repository. [splitsh](https://github.com/splitsh/lite) handles this for us automatically and you can mirror the current codebase out to each package by running the following:

```
./bin/split.sh
```

> 🚧 &nbsp; Please note that if you create a new package to also create a mirrored repository for it and to add this into `bin/split.sh`.

### Issuing a new release
#### Node
For publishing a new version of the Node SDK, you can handle this with Lerna by running `npm run publish` from the root directory. It will handle everything for you related to publishing the package.

#### PHP
To publish a new version of the PHP package, after you mirror the codebase with splitsh, check out the [PHP mirror](https://github.com/readmeio/metrics-sdks-php) and create a new tag there. Once the tag is pushed back into Git, Packagist will automatically pick it up.

#### Ruby
@todo

#### Python
1. `cd packages/python`
2. Update `version` in `setup.py`
3. Commit the changes to `setup.py` (and mirror that change).
4. `rm dist/*`
5. `python3 setup.py sdist bdist_wheel`
6. `python3 -m twine upload dist/*`
    * If you get errors about `twine` not being installed, install it with `pip3 install twine`.
    * On the first run you'll be asked to log into PyPi, so if you don't have access to `readme-metrics` there ask someone to hook you up with access.

