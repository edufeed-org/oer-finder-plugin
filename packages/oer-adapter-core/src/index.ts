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
} from './adapter.interface.js';

export { ALL_RESOURCE_TYPES } from './adapter.interface.js';

export {
  ALLOWED_AMB_FIELDS,
  filterAmbMetadata,
  type AllowedAmbField,
} from './amb-metadata.util.js';

export { isFilterIncompatible } from './filter-guard.js';

export {
  AMB_CONTEXT_URL,
  EMPTY_RESULT,
  isEmptySearch,
  paginateItems,
  buildExternalOerId,
} from './adapter-utils.js';

export {
  CC_LICENSE_URIS,
  ccCodeToLicenseUri,
  ccLicenseUriToCode,
  type CcLicenseCode,
} from './license.util.js';
