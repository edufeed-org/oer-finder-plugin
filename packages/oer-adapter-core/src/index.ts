export type {
  ImageUrls,
  AmbMetadata,
  ExternalOerExtensions,
  ExternalOerItem,
  ExternalOerItemWithSource,
  AdapterSearchOptions,
  AdapterSearchQuery,
  AdapterSearchResult,
  AdapterCapabilities,
  SourceAdapter,
} from './adapter.interface';

export { ALL_RESOURCE_TYPES } from './adapter.interface';

export {
  ALLOWED_AMB_FIELDS,
  filterAmbMetadata,
  type AllowedAmbField,
} from './amb-metadata.util';

export { isFilterIncompatible } from './filter-guard';

export {
  AMB_CONTEXT_URL,
  EMPTY_RESULT,
  isEmptySearch,
  paginateItems,
  buildExternalOerId,
} from './adapter-utils';

export {
  CC_LICENSE_URIS,
  ccCodeToLicenseUri,
  ccLicenseUriToCode,
  type CcLicenseCode,
} from './license.util';
