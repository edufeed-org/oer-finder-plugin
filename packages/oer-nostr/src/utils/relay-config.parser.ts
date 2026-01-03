/**
 * Utility for parsing and validating Nostr relay configuration.
 */
export class RelayConfigParser {
  private static readonly DEFAULT_RELAY_URL = 'ws://localhost:10547';

  /**
   * Parses relay URLs from configuration values with fallback logic.
   *
   * Priority:
   * 1. relayUrls (comma-separated list)
   * 2. relayUrl (single URL)
   * 3. Default localhost relay
   *
   * @param relayUrls - Comma-separated list of relay URLs
   * @param relayUrl - Single relay URL
   * @returns Array of normalized relay URLs
   */
  static parseRelayUrls(
    relayUrls: string,
    relayUrl: string,
  ): readonly string[] {
    // Try relayUrls first (comma-separated list)
    if (relayUrls) {
      const urls = this.parseCommaSeparatedUrls(relayUrls);
      if (urls.length > 0) {
        return urls;
      }
    }

    // Fall back to single relayUrl
    if (relayUrl?.trim()) {
      return [relayUrl.trim()];
    }

    // Fall back to default
    return [this.DEFAULT_RELAY_URL];
  }

  /**
   * Parses comma-separated URLs, trimming whitespace and filtering empty values.
   */
  private static parseCommaSeparatedUrls(urlString: string): string[] {
    return urlString
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }
}
