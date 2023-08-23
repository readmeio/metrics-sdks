'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var oas_1 = __importDefault(require('oas'));
var core_1 = __importDefault(require('api/dist/core'));
var openapi_json_1 = __importDefault(require('./openapi.json'));
var SDK = /** @class */ (function () {
  function SDK() {
    this.spec = oas_1.default.init(openapi_json_1.default);
    this.core = new core_1.default(this.spec, 'developers/4.465.0 (api/6.1.0)');
  }
  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  SDK.prototype.config = function (config) {
    this.core.setConfig(config);
  };
  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  SDK.prototype.auth = function () {
    var _a;
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      values[_i] = arguments[_i];
    }
    (_a = this.core).setAuth.apply(_a, values);
    return this;
  };
  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  SDK.prototype.server = function (url, variables) {
    if (variables === void 0) {
      variables = {};
    }
    this.core.setServer(url, variables);
  };
  /**
   * Get an API definition file that's been uploaded to ReadMe.
   *
   * @summary Retrieve an entry from the API Registry
   * @throws FetchError<404, types.GetApiRegistryResponse404> The registry entry couldn't be found.
   */
  SDK.prototype.getAPIRegistry = function (metadata) {
    return this.core.fetch('/api-registry/{uuid}', 'get', metadata);
  };
  /**
   * Get API specification metadata.
   *
   * @summary Get metadata
   * @throws FetchError<400, types.GetApiSpecificationResponse400> No version was supplied.
   * @throws FetchError<401, types.GetApiSpecificationResponse401> Unauthorized
   * @throws FetchError<403, types.GetApiSpecificationResponse403> Unauthorized
   * @throws FetchError<404, types.GetApiSpecificationResponse404> The version couldn't be found.
   */
  SDK.prototype.getAPISpecification = function (metadata) {
    return this.core.fetch('/api-specification', 'get', metadata);
  };
  /**
   * Upload an API specification to ReadMe. Or, to use a newer solution see
   * https://docs.readme.com/main/docs/rdme.
   *
   * @summary Upload specification
   * @throws FetchError<400, types.UploadApiSpecificationResponse400> There was a validation error during upload.
   * @throws FetchError<401, types.UploadApiSpecificationResponse401> Unauthorized
   * @throws FetchError<403, types.UploadApiSpecificationResponse403> Unauthorized
   * @throws FetchError<408, types.UploadApiSpecificationResponse408> The spec upload timed out.
   */
  SDK.prototype.uploadAPISpecification = function (body, metadata) {
    return this.core.fetch('/api-specification', 'post', body, metadata);
  };
  /**
   * Update an API specification in ReadMe.
   *
   * @summary Update specification
   * @throws FetchError<400, types.UpdateApiSpecificationResponse400> There was a validation error during upload.
   * @throws FetchError<401, types.UpdateApiSpecificationResponse401> Unauthorized
   * @throws FetchError<403, types.UpdateApiSpecificationResponse403> Unauthorized
   * @throws FetchError<408, types.UpdateApiSpecificationResponse408> The spec upload timed out.
   */
  SDK.prototype.updateAPISpecification = function (body, metadata) {
    return this.core.fetch('/api-specification/{id}', 'put', body, metadata);
  };
  /**
   * Delete an API specification in ReadMe.
   *
   * @summary Delete specification
   * @throws FetchError<400, types.DeleteApiSpecificationResponse400> The spec ID isn't valid.
   * @throws FetchError<401, types.DeleteApiSpecificationResponse401> Unauthorized
   * @throws FetchError<403, types.DeleteApiSpecificationResponse403> Unauthorized
   * @throws FetchError<404, types.DeleteApiSpecificationResponse404> The spec couldn't be found.
   */
  SDK.prototype.deleteAPISpecification = function (metadata) {
    return this.core.fetch('/api-specification/{id}', 'delete', metadata);
  };
  /**
   * Returns all the roles we're hiring for at ReadMe!
   *
   * @summary Get open roles
   */
  SDK.prototype.getOpenRoles = function () {
    return this.core.fetch('/apply', 'get');
  };
  /**
   * This endpoint will let you apply to a job at ReadMe programatically, without having to
   * go through our UI!
   *
   * @summary Submit your application!
   */
  SDK.prototype.applyToReadMe = function (body) {
    return this.core.fetch('/apply', 'post', body);
  };
  /**
   * Returns all the categories for a specified version.
   *
   * @summary Get all categories
   */
  SDK.prototype.getCategories = function (metadata) {
    return this.core.fetch('/categories', 'get', metadata);
  };
  /**
   * Create a new category inside of this project.
   *
   * @summary Create category
   * @throws FetchError<400, types.CreateCategoryResponse400> The category couldn't be saved.
   */
  SDK.prototype.createCategory = function (body, metadata) {
    return this.core.fetch('/categories', 'post', body, metadata);
  };
  /**
   * Returns the category with this slug.
   *
   * @summary Get category
   * @throws FetchError<404, types.GetCategoryResponse404> The category couldn't be found.
   */
  SDK.prototype.getCategory = function (metadata) {
    return this.core.fetch('/categories/{slug}', 'get', metadata);
  };
  /**
   * Change the properties of a category.
   *
   * @summary Update category
   * @throws FetchError<400, types.UpdateCategoryResponse400> The category couldn't be saved.
   * @throws FetchError<404, types.UpdateCategoryResponse404> The category couldn't be found.
   */
  SDK.prototype.updateCategory = function (body, metadata) {
    return this.core.fetch('/categories/{slug}', 'put', body, metadata);
  };
  /**
   * Delete the category with this slug.
   * >⚠️Heads Up!
   * > This will also delete all of the docs within this category.
   *
   * @summary Delete category
   * @throws FetchError<404, types.DeleteCategoryResponse404> The category couldn't be found.
   */
  SDK.prototype.deleteCategory = function (metadata) {
    return this.core.fetch('/categories/{slug}', 'delete', metadata);
  };
  /**
   * Returns the docs and children docs within this category.
   *
   * @summary Get docs for category
   * @throws FetchError<404, types.GetCategoryDocsResponse404> The category couldn't be found.
   */
  SDK.prototype.getCategoryDocs = function (metadata) {
    return this.core.fetch('/categories/{slug}/docs', 'get', metadata);
  };
  /**
   * Returns a list of changelogs.
   *
   * @summary Get changelogs
   */
  SDK.prototype.getChangelogs = function (metadata) {
    return this.core.fetch('/changelogs', 'get', metadata);
  };
  /**
   * Create a new changelog entry.
   *
   * @summary Create changelog
   */
  SDK.prototype.createChangelog = function (body) {
    return this.core.fetch('/changelogs', 'post', body);
  };
  /**
   * Returns the changelog with this slug.
   *
   * @summary Get changelog
   */
  SDK.prototype.getChangelog = function (metadata) {
    return this.core.fetch('/changelogs/{slug}', 'get', metadata);
  };
  /**
   * Update a changelog with this slug.
   *
   * @summary Update changelog
   */
  SDK.prototype.updateChangelog = function (body, metadata) {
    return this.core.fetch('/changelogs/{slug}', 'put', body, metadata);
  };
  /**
   * Delete the changelog with this slug.
   *
   * @summary Delete changelog
   */
  SDK.prototype.deleteChangelog = function (metadata) {
    return this.core.fetch('/changelogs/{slug}', 'delete', metadata);
  };
  /**
   * Returns a list of custom pages.
   *
   * @summary Get custom pages
   * @throws FetchError<401, types.GetCustomPagesResponse401> Unauthorized
   * @throws FetchError<403, types.GetCustomPagesResponse403> Unauthorized
   */
  SDK.prototype.getCustomPages = function (metadata) {
    return this.core.fetch('/custompages', 'get', metadata);
  };
  /**
   * Create a new custom page inside of this project.
   *
   * @summary Create custom page
   * @throws FetchError<400, types.CreateCustomPageResponse400> The page couldn't be saved.
   * @throws FetchError<401, types.CreateCustomPageResponse401> Unauthorized
   * @throws FetchError<403, types.CreateCustomPageResponse403> Unauthorized
   */
  SDK.prototype.createCustomPage = function (body) {
    return this.core.fetch('/custompages', 'post', body);
  };
  /**
   * Returns the custom page with this slug.
   *
   * @summary Get custom page
   * @throws FetchError<401, types.GetCustomPageResponse401> Unauthorized
   * @throws FetchError<403, types.GetCustomPageResponse403> Unauthorized
   * @throws FetchError<404, types.GetCustomPageResponse404> The custom page couldn't be found.
   */
  SDK.prototype.getCustomPage = function (metadata) {
    return this.core.fetch('/custompages/{slug}', 'get', metadata);
  };
  /**
   * Update a custom page with this slug.
   *
   * @summary Update custom page
   * @throws FetchError<400, types.UpdateCustomPageResponse400> The page couldn't be saved.
   * @throws FetchError<401, types.UpdateCustomPageResponse401> Unauthorized
   * @throws FetchError<403, types.UpdateCustomPageResponse403> Unauthorized
   * @throws FetchError<404, types.UpdateCustomPageResponse404> The custom page couldn't be found.
   */
  SDK.prototype.updateCustomPage = function (body, metadata) {
    return this.core.fetch('/custompages/{slug}', 'put', body, metadata);
  };
  /**
   * Delete the custom page with this slug.
   *
   * @summary Delete custom page
   * @throws FetchError<401, types.DeleteCustomPageResponse401> Unauthorized
   * @throws FetchError<403, types.DeleteCustomPageResponse403> Unauthorized
   * @throws FetchError<404, types.DeleteCustomPageResponse404> The custom page couldn't be found.
   */
  SDK.prototype.deleteCustomPage = function (metadata) {
    return this.core.fetch('/custompages/{slug}', 'delete', metadata);
  };
  /**
   * Returns the doc with this slug.
   *
   * @summary Get doc
   * @throws FetchError<401, types.GetDocResponse401> Unauthorized
   * @throws FetchError<403, types.GetDocResponse403> Unauthorized
   * @throws FetchError<404, types.GetDocResponse404> The doc couldn't be found.
   */
  SDK.prototype.getDoc = function (metadata) {
    return this.core.fetch('/docs/{slug}', 'get', metadata);
  };
  /**
   * Update a doc with this slug.
   *
   * @summary Update doc
   * @throws FetchError<400, types.UpdateDocResponse400> The doc couldn't be saved.
   * @throws FetchError<401, types.UpdateDocResponse401> Unauthorized
   * @throws FetchError<403, types.UpdateDocResponse403> Unauthorized
   * @throws FetchError<404, types.UpdateDocResponse404> The doc couldn't be found.
   */
  SDK.prototype.updateDoc = function (body, metadata) {
    return this.core.fetch('/docs/{slug}', 'put', body, metadata);
  };
  /**
   * Delete the doc with this slug.
   *
   * @summary Delete doc
   * @throws FetchError<401, types.DeleteDocResponse401> Unauthorized
   * @throws FetchError<403, types.DeleteDocResponse403> Unauthorized
   * @throws FetchError<404, types.DeleteDocResponse404> The doc couldn't be found.
   */
  SDK.prototype.deleteDoc = function (metadata) {
    return this.core.fetch('/docs/{slug}', 'delete', metadata);
  };
  /**
   * This is intended for use by enterprise users with staging enabled. This endpoint will
   * return the live version of your document, whereas the standard endpoint will always
   * return staging.
   *
   * @summary Get production doc
   * @throws FetchError<401, types.GetProductionDocResponse401> Unauthorized
   * @throws FetchError<403, types.GetProductionDocResponse403> Unauthorized
   * @throws FetchError<404, types.GetProductionDocResponse404> The doc couldn't be found.
   */
  SDK.prototype.getProductionDoc = function (metadata) {
    return this.core.fetch('/docs/{slug}/production', 'get', metadata);
  };
  /**
   * Create a new doc inside of this project.
   *
   * @summary Create doc
   * @throws FetchError<400, types.CreateDocResponse400> The doc couldn't be saved.
   * @throws FetchError<401, types.CreateDocResponse401> Unauthorized
   * @throws FetchError<403, types.CreateDocResponse403> Unauthorized
   */
  SDK.prototype.createDoc = function (body, metadata) {
    return this.core.fetch('/docs', 'post', body, metadata);
  };
  /**
   * Returns all docs that match the search.
   *
   * @summary Search docs
   * @throws FetchError<401, types.SearchDocsResponse401> Unauthorized
   * @throws FetchError<403, types.SearchDocsResponse403> Unauthorized
   */
  SDK.prototype.searchDocs = function (metadata) {
    return this.core.fetch('/docs/search', 'post', metadata);
  };
  /**
   * Returns project data for the API key.
   *
   * @summary Get metadata about the current project
   * @throws FetchError<401, types.GetProjectResponse401> Unauthorized
   * @throws FetchError<403, types.GetProjectResponse403> Unauthorized
   */
  SDK.prototype.getProject = function () {
    return this.core.fetch('/', 'get');
  };
  /**
   * Returns a copy of our OpenAPI Definition.
   *
   * @summary Get our OpenAPI Definition
   */
  SDK.prototype.getAPISchema = function () {
    return this.core.fetch('/schema', 'get');
  };
  /**
   * Retrieve a list of versions associated with a project API key.
   *
   * @summary Get versions
   * @throws FetchError<401, types.GetVersionsResponse401> Unauthorized
   * @throws FetchError<403, types.GetVersionsResponse403> Unauthorized
   */
  SDK.prototype.getVersions = function () {
    return this.core.fetch('/version', 'get');
  };
  /**
   * Create a new version.
   *
   * @summary Create version
   * @throws FetchError<400, types.CreateVersionResponse400> There was a validation error during creation.
   * @throws FetchError<401, types.CreateVersionResponse401> Unauthorized
   * @throws FetchError<403, types.CreateVersionResponse403> Unauthorized
   * @throws FetchError<404, types.CreateVersionResponse404> The version couldn't be found.
   */
  SDK.prototype.createVersion = function (body) {
    return this.core.fetch('/version', 'post', body);
  };
  /**
   * Returns the version with this version ID.
   *
   * @summary Get version
   * @throws FetchError<401, types.GetVersionResponse401> Unauthorized
   * @throws FetchError<403, types.GetVersionResponse403> Unauthorized
   * @throws FetchError<404, types.GetVersionResponse404> The version couldn't be found.
   */
  SDK.prototype.getVersion = function (metadata) {
    return this.core.fetch('/version/{versionId}', 'get', metadata);
  };
  /**
   * Update an existing version.
   *
   * @summary Update version
   * @throws FetchError<400, types.UpdateVersionResponse400> A stable version can't be demoted.
   * @throws FetchError<401, types.UpdateVersionResponse401> Unauthorized
   * @throws FetchError<403, types.UpdateVersionResponse403> Unauthorized
   * @throws FetchError<404, types.UpdateVersionResponse404> The version couldn't be found.
   */
  SDK.prototype.updateVersion = function (body, metadata) {
    return this.core.fetch('/version/{versionId}', 'put', body, metadata);
  };
  /**
   * Delete a version
   *
   * @summary Delete version
   * @throws FetchError<400, types.DeleteVersionResponse400> A stable version can't be removed.
   * @throws FetchError<401, types.DeleteVersionResponse401> Unauthorized
   * @throws FetchError<403, types.DeleteVersionResponse403> Unauthorized
   * @throws FetchError<404, types.DeleteVersionResponse404> The version couldn't be found.
   */
  SDK.prototype.deleteVersion = function (metadata) {
    return this.core.fetch('/version/{versionId}', 'delete', metadata);
  };
  return SDK;
})();
var createSDK = (function () {
  return new SDK();
})();
module.exports = createSDK;
