import { RelayConfigParser } from '../../src/utils/relay-config.parser';

describe('RelayConfigParser', () => {
  describe('parseRelayUrls', () => {
    it('should parse comma-separated relay URLs from relayUrls', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        'wss://relay1.com,wss://relay2.com',
        '',
      );
      expect(urls).toEqual(['wss://relay1.com', 'wss://relay2.com']);
    });

    it('should trim whitespace from relay URLs', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        ' wss://relay1.com , wss://relay2.com ',
        '',
      );
      expect(urls).toEqual(['wss://relay1.com', 'wss://relay2.com']);
    });

    it('should filter out empty URLs', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        'wss://relay1.com,,wss://relay2.com',
        '',
      );
      expect(urls).toEqual(['wss://relay1.com', 'wss://relay2.com']);
    });

    it('should handle URLs with only commas and whitespace', () => {
      const urls = RelayConfigParser.parseRelayUrls(' , , ', '');
      expect(urls).toEqual(['ws://localhost:10547']); // Falls back to default
    });

    it('should fall back to relayUrl if relayUrls not set', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        '',
        'wss://single-relay.com',
      );
      expect(urls).toEqual(['wss://single-relay.com']);
    });

    it('should use default URL if neither parameter is set', () => {
      const urls = RelayConfigParser.parseRelayUrls('', '');
      expect(urls).toEqual(['ws://localhost:10547']);
    });

    it('should prioritize relayUrls over relayUrl', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        'wss://relay1.com,wss://relay2.com',
        'wss://single-relay.com',
      );
      expect(urls).toEqual(['wss://relay1.com', 'wss://relay2.com']);
    });

    it('should return readonly array', () => {
      const urls = RelayConfigParser.parseRelayUrls('', '');
      expect(Array.isArray(urls)).toBe(true);
      // TypeScript compile-time check ensures readonly
    });

    it('should handle single URL in relayUrls', () => {
      const urls = RelayConfigParser.parseRelayUrls('wss://single.com', '');
      expect(urls).toEqual(['wss://single.com']);
    });

    it('should handle many URLs in relayUrls', () => {
      const urls = RelayConfigParser.parseRelayUrls(
        'wss://relay1.com,wss://relay2.com,wss://relay3.com,wss://relay4.com',
        '',
      );
      expect(urls).toHaveLength(4);
      expect(urls).toEqual([
        'wss://relay1.com',
        'wss://relay2.com',
        'wss://relay3.com',
        'wss://relay4.com',
      ]);
    });
  });
});
