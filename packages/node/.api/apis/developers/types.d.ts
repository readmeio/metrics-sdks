import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';
export type ApplyToReadMeBodyParam = FromSchema<typeof schemas.ApplyToReadMe.body>;
export type CreateCategoryBodyParam = FromSchema<typeof schemas.CreateCategory.body>;
export type CreateCategoryMetadataParam = FromSchema<typeof schemas.CreateCategory.metadata>;
export type CreateCategoryResponse400 = FromSchema<(typeof schemas.CreateCategory.response)['400']>;
export type CreateChangelogBodyParam = FromSchema<typeof schemas.CreateChangelog.body>;
export type CreateCustomPageBodyParam = FromSchema<typeof schemas.CreateCustomPage.body>;
export type CreateCustomPageResponse400 = FromSchema<
  (typeof schemas.CreateCustomPage.response)['400']
>;
export type CreateCustomPageResponse401 = FromSchema<
  (typeof schemas.CreateCustomPage.response)['401']
>;
export type CreateCustomPageResponse403 = FromSchema<
  (typeof schemas.CreateCustomPage.response)['403']
>;
export type CreateDocBodyParam = FromSchema<typeof schemas.CreateDoc.body>;
export type CreateDocMetadataParam = FromSchema<typeof schemas.CreateDoc.metadata>;
export type CreateDocResponse201 = FromSchema<(typeof schemas.CreateDoc.response)['201']>;
export type CreateDocResponse400 = FromSchema<(typeof schemas.CreateDoc.response)['400']>;
export type CreateDocResponse401 = FromSchema<(typeof schemas.CreateDoc.response)['401']>;
export type CreateDocResponse403 = FromSchema<(typeof schemas.CreateDoc.response)['403']>;
export type CreateVersionBodyParam = FromSchema<typeof schemas.CreateVersion.body>;
export type CreateVersionResponse400 = FromSchema<(typeof schemas.CreateVersion.response)['400']>;
export type CreateVersionResponse401 = FromSchema<(typeof schemas.CreateVersion.response)['401']>;
export type CreateVersionResponse403 = FromSchema<(typeof schemas.CreateVersion.response)['403']>;
export type CreateVersionResponse404 = FromSchema<(typeof schemas.CreateVersion.response)['404']>;
export type DeleteApiSpecificationMetadataParam = FromSchema<
  typeof schemas.DeleteApiSpecification.metadata
>;
export type DeleteApiSpecificationResponse400 = FromSchema<
  (typeof schemas.DeleteApiSpecification.response)['400']
>;
export type DeleteApiSpecificationResponse401 = FromSchema<
  (typeof schemas.DeleteApiSpecification.response)['401']
>;
export type DeleteApiSpecificationResponse403 = FromSchema<
  (typeof schemas.DeleteApiSpecification.response)['403']
>;
export type DeleteApiSpecificationResponse404 = FromSchema<
  (typeof schemas.DeleteApiSpecification.response)['404']
>;
export type DeleteCategoryMetadataParam = FromSchema<typeof schemas.DeleteCategory.metadata>;
export type DeleteCategoryResponse404 = FromSchema<(typeof schemas.DeleteCategory.response)['404']>;
export type DeleteChangelogMetadataParam = FromSchema<typeof schemas.DeleteChangelog.metadata>;
export type DeleteCustomPageMetadataParam = FromSchema<typeof schemas.DeleteCustomPage.metadata>;
export type DeleteCustomPageResponse401 = FromSchema<
  (typeof schemas.DeleteCustomPage.response)['401']
>;
export type DeleteCustomPageResponse403 = FromSchema<
  (typeof schemas.DeleteCustomPage.response)['403']
>;
export type DeleteCustomPageResponse404 = FromSchema<
  (typeof schemas.DeleteCustomPage.response)['404']
>;
export type DeleteDocMetadataParam = FromSchema<typeof schemas.DeleteDoc.metadata>;
export type DeleteDocResponse401 = FromSchema<(typeof schemas.DeleteDoc.response)['401']>;
export type DeleteDocResponse403 = FromSchema<(typeof schemas.DeleteDoc.response)['403']>;
export type DeleteDocResponse404 = FromSchema<(typeof schemas.DeleteDoc.response)['404']>;
export type DeleteVersionMetadataParam = FromSchema<typeof schemas.DeleteVersion.metadata>;
export type DeleteVersionResponse400 = FromSchema<(typeof schemas.DeleteVersion.response)['400']>;
export type DeleteVersionResponse401 = FromSchema<(typeof schemas.DeleteVersion.response)['401']>;
export type DeleteVersionResponse403 = FromSchema<(typeof schemas.DeleteVersion.response)['403']>;
export type DeleteVersionResponse404 = FromSchema<(typeof schemas.DeleteVersion.response)['404']>;
export type GetApiRegistryMetadataParam = FromSchema<typeof schemas.GetApiRegistry.metadata>;
export type GetApiRegistryResponse200 = FromSchema<(typeof schemas.GetApiRegistry.response)['200']>;
export type GetApiRegistryResponse404 = FromSchema<(typeof schemas.GetApiRegistry.response)['404']>;
export type GetApiSchemaResponse200 = FromSchema<(typeof schemas.GetApiSchema.response)['200']>;
export type GetApiSpecificationMetadataParam = FromSchema<
  typeof schemas.GetApiSpecification.metadata
>;
export type GetApiSpecificationResponse200 = FromSchema<
  (typeof schemas.GetApiSpecification.response)['200']
>;
export type GetApiSpecificationResponse400 = FromSchema<
  (typeof schemas.GetApiSpecification.response)['400']
>;
export type GetApiSpecificationResponse401 = FromSchema<
  (typeof schemas.GetApiSpecification.response)['401']
>;
export type GetApiSpecificationResponse403 = FromSchema<
  (typeof schemas.GetApiSpecification.response)['403']
>;
export type GetApiSpecificationResponse404 = FromSchema<
  (typeof schemas.GetApiSpecification.response)['404']
>;
export type GetCategoriesMetadataParam = FromSchema<typeof schemas.GetCategories.metadata>;
export type GetCategoriesResponse200 = FromSchema<(typeof schemas.GetCategories.response)['200']>;
export type GetCategoryDocsMetadataParam = FromSchema<typeof schemas.GetCategoryDocs.metadata>;
export type GetCategoryDocsResponse404 = FromSchema<
  (typeof schemas.GetCategoryDocs.response)['404']
>;
export type GetCategoryMetadataParam = FromSchema<typeof schemas.GetCategory.metadata>;
export type GetCategoryResponse404 = FromSchema<(typeof schemas.GetCategory.response)['404']>;
export type GetChangelogMetadataParam = FromSchema<typeof schemas.GetChangelog.metadata>;
export type GetChangelogsMetadataParam = FromSchema<typeof schemas.GetChangelogs.metadata>;
export type GetChangelogsResponse200 = FromSchema<(typeof schemas.GetChangelogs.response)['200']>;
export type GetCustomPageMetadataParam = FromSchema<typeof schemas.GetCustomPage.metadata>;
export type GetCustomPageResponse401 = FromSchema<(typeof schemas.GetCustomPage.response)['401']>;
export type GetCustomPageResponse403 = FromSchema<(typeof schemas.GetCustomPage.response)['403']>;
export type GetCustomPageResponse404 = FromSchema<(typeof schemas.GetCustomPage.response)['404']>;
export type GetCustomPagesMetadataParam = FromSchema<typeof schemas.GetCustomPages.metadata>;
export type GetCustomPagesResponse200 = FromSchema<(typeof schemas.GetCustomPages.response)['200']>;
export type GetCustomPagesResponse401 = FromSchema<(typeof schemas.GetCustomPages.response)['401']>;
export type GetCustomPagesResponse403 = FromSchema<(typeof schemas.GetCustomPages.response)['403']>;
export type GetDocMetadataParam = FromSchema<typeof schemas.GetDoc.metadata>;
export type GetDocResponse200 = FromSchema<(typeof schemas.GetDoc.response)['200']>;
export type GetDocResponse401 = FromSchema<(typeof schemas.GetDoc.response)['401']>;
export type GetDocResponse403 = FromSchema<(typeof schemas.GetDoc.response)['403']>;
export type GetDocResponse404 = FromSchema<(typeof schemas.GetDoc.response)['404']>;
export type GetOpenRolesResponse200 = FromSchema<(typeof schemas.GetOpenRoles.response)['200']>;
export type GetProductionDocMetadataParam = FromSchema<typeof schemas.GetProductionDoc.metadata>;
export type GetProductionDocResponse200 = FromSchema<
  (typeof schemas.GetProductionDoc.response)['200']
>;
export type GetProductionDocResponse401 = FromSchema<
  (typeof schemas.GetProductionDoc.response)['401']
>;
export type GetProductionDocResponse403 = FromSchema<
  (typeof schemas.GetProductionDoc.response)['403']
>;
export type GetProductionDocResponse404 = FromSchema<
  (typeof schemas.GetProductionDoc.response)['404']
>;
export type GetProjectResponse200 = FromSchema<(typeof schemas.GetProject.response)['200']>;
export type GetProjectResponse401 = FromSchema<(typeof schemas.GetProject.response)['401']>;
export type GetProjectResponse403 = FromSchema<(typeof schemas.GetProject.response)['403']>;
export type GetVersionMetadataParam = FromSchema<typeof schemas.GetVersion.metadata>;
export type GetVersionResponse401 = FromSchema<(typeof schemas.GetVersion.response)['401']>;
export type GetVersionResponse403 = FromSchema<(typeof schemas.GetVersion.response)['403']>;
export type GetVersionResponse404 = FromSchema<(typeof schemas.GetVersion.response)['404']>;
export type GetVersionsResponse401 = FromSchema<(typeof schemas.GetVersions.response)['401']>;
export type GetVersionsResponse403 = FromSchema<(typeof schemas.GetVersions.response)['403']>;
export type SearchDocsMetadataParam = FromSchema<typeof schemas.SearchDocs.metadata>;
export type SearchDocsResponse401 = FromSchema<(typeof schemas.SearchDocs.response)['401']>;
export type SearchDocsResponse403 = FromSchema<(typeof schemas.SearchDocs.response)['403']>;
export type UpdateApiSpecificationBodyParam = FromSchema<
  typeof schemas.UpdateApiSpecification.body
>;
export type UpdateApiSpecificationMetadataParam = FromSchema<
  typeof schemas.UpdateApiSpecification.metadata
>;
export type UpdateApiSpecificationResponse400 = FromSchema<
  (typeof schemas.UpdateApiSpecification.response)['400']
>;
export type UpdateApiSpecificationResponse401 = FromSchema<
  (typeof schemas.UpdateApiSpecification.response)['401']
>;
export type UpdateApiSpecificationResponse403 = FromSchema<
  (typeof schemas.UpdateApiSpecification.response)['403']
>;
export type UpdateApiSpecificationResponse408 = FromSchema<
  (typeof schemas.UpdateApiSpecification.response)['408']
>;
export type UpdateCategoryBodyParam = FromSchema<typeof schemas.UpdateCategory.body>;
export type UpdateCategoryMetadataParam = FromSchema<typeof schemas.UpdateCategory.metadata>;
export type UpdateCategoryResponse400 = FromSchema<(typeof schemas.UpdateCategory.response)['400']>;
export type UpdateCategoryResponse404 = FromSchema<(typeof schemas.UpdateCategory.response)['404']>;
export type UpdateChangelogBodyParam = FromSchema<typeof schemas.UpdateChangelog.body>;
export type UpdateChangelogMetadataParam = FromSchema<typeof schemas.UpdateChangelog.metadata>;
export type UpdateCustomPageBodyParam = FromSchema<typeof schemas.UpdateCustomPage.body>;
export type UpdateCustomPageMetadataParam = FromSchema<typeof schemas.UpdateCustomPage.metadata>;
export type UpdateCustomPageResponse400 = FromSchema<
  (typeof schemas.UpdateCustomPage.response)['400']
>;
export type UpdateCustomPageResponse401 = FromSchema<
  (typeof schemas.UpdateCustomPage.response)['401']
>;
export type UpdateCustomPageResponse403 = FromSchema<
  (typeof schemas.UpdateCustomPage.response)['403']
>;
export type UpdateCustomPageResponse404 = FromSchema<
  (typeof schemas.UpdateCustomPage.response)['404']
>;
export type UpdateDocBodyParam = FromSchema<typeof schemas.UpdateDoc.body>;
export type UpdateDocMetadataParam = FromSchema<typeof schemas.UpdateDoc.metadata>;
export type UpdateDocResponse200 = FromSchema<(typeof schemas.UpdateDoc.response)['200']>;
export type UpdateDocResponse400 = FromSchema<(typeof schemas.UpdateDoc.response)['400']>;
export type UpdateDocResponse401 = FromSchema<(typeof schemas.UpdateDoc.response)['401']>;
export type UpdateDocResponse403 = FromSchema<(typeof schemas.UpdateDoc.response)['403']>;
export type UpdateDocResponse404 = FromSchema<(typeof schemas.UpdateDoc.response)['404']>;
export type UpdateVersionBodyParam = FromSchema<typeof schemas.UpdateVersion.body>;
export type UpdateVersionMetadataParam = FromSchema<typeof schemas.UpdateVersion.metadata>;
export type UpdateVersionResponse400 = FromSchema<(typeof schemas.UpdateVersion.response)['400']>;
export type UpdateVersionResponse401 = FromSchema<(typeof schemas.UpdateVersion.response)['401']>;
export type UpdateVersionResponse403 = FromSchema<(typeof schemas.UpdateVersion.response)['403']>;
export type UpdateVersionResponse404 = FromSchema<(typeof schemas.UpdateVersion.response)['404']>;
export type UploadApiSpecificationBodyParam = FromSchema<
  typeof schemas.UploadApiSpecification.body
>;
export type UploadApiSpecificationMetadataParam = FromSchema<
  typeof schemas.UploadApiSpecification.metadata
>;
export type UploadApiSpecificationResponse400 = FromSchema<
  (typeof schemas.UploadApiSpecification.response)['400']
>;
export type UploadApiSpecificationResponse401 = FromSchema<
  (typeof schemas.UploadApiSpecification.response)['401']
>;
export type UploadApiSpecificationResponse403 = FromSchema<
  (typeof schemas.UploadApiSpecification.response)['403']
>;
export type UploadApiSpecificationResponse408 = FromSchema<
  (typeof schemas.UploadApiSpecification.response)['408']
>;
