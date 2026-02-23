/**
 * Canonical Creative Commons license URIs.
 * Maps short license codes to their full URIs.
 */
export const CC_LICENSE_URIS = {
  by: 'https://creativecommons.org/licenses/by/4.0/',
  'by-sa': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'by-nc': 'https://creativecommons.org/licenses/by-nc/4.0/',
  'by-nd': 'https://creativecommons.org/licenses/by-nd/4.0/',
  'by-nc-sa': 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  'by-nc-nd': 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  pdm: 'https://creativecommons.org/publicdomain/mark/1.0/',
} as const;

export type CcLicenseCode = keyof typeof CC_LICENSE_URIS;

/**
 * Convert a CC license short code to its full URI.
 * Case-insensitive. Returns null for unknown codes.
 */
export function ccCodeToLicenseUri(code: string): string | null {
  const normalized = code.toLowerCase();

  // Handle public-domain alias for pdm
  if (normalized === 'public-domain') {
    return CC_LICENSE_URIS.pdm;
  }

  const entry = CC_LICENSE_URIS[normalized as CcLicenseCode];
  return entry ?? null;
}

/**
 * URI pattern to license code mapping for reverse lookups.
 * Ordered from most specific to least specific to avoid false matches.
 */
const URI_TO_CODE_PATTERNS: ReadonlyArray<{
  pattern: string;
  code: CcLicenseCode;
}> = [
  { pattern: 'publicdomain/zero', code: 'cc0' },
  { pattern: 'publicdomain/mark', code: 'pdm' },
  { pattern: 'licenses/by-nc-sa/', code: 'by-nc-sa' },
  { pattern: 'licenses/by-nc-nd/', code: 'by-nc-nd' },
  { pattern: 'licenses/by-nc/', code: 'by-nc' },
  { pattern: 'licenses/by-sa/', code: 'by-sa' },
  { pattern: 'licenses/by-nd/', code: 'by-nd' },
  { pattern: 'licenses/by/', code: 'by' },
];

/**
 * Extract a CC license short code from a full license URI.
 * Uses substring matching. Returns null for unrecognized URIs.
 */
export function ccLicenseUriToCode(uri: string): CcLicenseCode | null {
  for (const { pattern, code } of URI_TO_CODE_PATTERNS) {
    if (uri.includes(pattern)) {
      return code;
    }
  }
  return null;
}
