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
