/**
 * Default source identifier for resources from the Nostr network.
 */
export declare const DEFAULT_SOURCE = "nostr";
/**
 * Common Creative Commons and other OER licenses
 * Full URIs and human-readable short names
 */
export interface License {
    uri: string;
    shortName: string;
}
export declare const COMMON_LICENSES: License[];
/**
 * Get short name for a license URI
 */
export declare function getLicenseShortName(uri: string): string | null;
/**
 * Language options for the filter dropdown
 */
export interface LanguageOption {
    code: string;
    label: string;
}
export declare const FILTER_LANGUAGES: LanguageOption[];
/**
 * Resource type options for the type filter dropdown
 */
export interface ResourceTypeOption {
    value: string;
    label: string;
}
export declare const RESOURCE_TYPES: ResourceTypeOption[];
