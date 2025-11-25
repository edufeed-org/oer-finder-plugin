/**
 * ImgproxyService Mock Factory
 *
 * Provides reusable mock factories for the ImgproxyService.
 * Used in service tests that need to mock image proxy URL generation.
 */

import type { ImgproxyService } from '../../../src/oer/services/imgproxy.service';

/**
 * Standard imgproxy URLs for testing
 */
export const mockImgproxyUrls = {
  high: 'http://localhost:8080/insecure/rs:fit:0:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
  medium:
    'http://localhost:8080/insecure/rs:fit:400:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
  small:
    'http://localhost:8080/insecure/rs:fit:200:0/plain/https%3A%2F%2Fexample.com%2Fimage.jpg',
};

/**
 * Configuration options for the imgproxy service mock
 */
export interface ImgproxyServiceMockConfig {
  /** Whether imgproxy is enabled */
  isEnabled?: boolean;
  /** URLs to return from generateUrls (null if not an image) */
  generateUrlsResult?: typeof mockImgproxyUrls | null;
}

/**
 * Creates a mock ImgproxyService
 *
 * @example
 * ```typescript
 * // Disabled imgproxy (default)
 * const imgproxyMock = createImgproxyServiceMock();
 *
 * // Enabled imgproxy with default URLs
 * const imgproxyMock = createImgproxyServiceMock({
 *   isEnabled: true,
 *   generateUrlsResult: mockImgproxyUrls,
 * });
 * ```
 */
export function createImgproxyServiceMock(
  config: ImgproxyServiceMockConfig = {},
): jest.Mocked<ImgproxyService> {
  const { isEnabled = false, generateUrlsResult = null } = config;

  return {
    isEnabled: jest.fn().mockReturnValue(isEnabled),
    generateUrls: jest.fn().mockReturnValue(generateUrlsResult),
  } as unknown as jest.Mocked<ImgproxyService>;
}

/**
 * Creates an ImgproxyService mock configured to generate URLs
 * Useful for tests that specifically test image proxy behavior
 */
export function createEnabledImgproxyServiceMock(): jest.Mocked<ImgproxyService> {
  return createImgproxyServiceMock({
    isEnabled: true,
    generateUrlsResult: mockImgproxyUrls,
  });
}

/**
 * Creates an ImgproxyService mock that is disabled
 * Useful for tests where imgproxy should not interfere
 */
export function createDisabledImgproxyServiceMock(): jest.Mocked<ImgproxyService> {
  return createImgproxyServiceMock({
    isEnabled: false,
    generateUrlsResult: null,
  });
}
