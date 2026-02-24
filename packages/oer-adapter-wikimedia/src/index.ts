export {
  WikimediaAdapter,
  createWikimediaAdapter,
} from './wikimedia.adapter.js';
export type {
  WikimediaPage,
  WikimediaImageInfo,
  WikimediaExtmetadata,
  WikimediaSearchResponse,
} from './wikimedia.types.js';
export {
  WikimediaPageSchema,
  WikimediaImageInfoSchema,
  WikimediaExtmetadataSchema,
  WikimediaSearchResponseSchema,
  parseWikimediaSearchResponse,
} from './wikimedia.types.js';
export {
  mapWikimediaPageToAmb,
  buildImageUrls,
  cleanTitle,
  stripHtmlTags,
  parseCategories,
  normalizeLicenseUrl,
} from './mappers/wikimedia-to-amb.mapper.js';
