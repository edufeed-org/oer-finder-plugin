import { isPrivateIp } from './is-private-ip';

describe('isPrivateIp', () => {
  describe('IPv4 private ranges', () => {
    it.each([
      ['127.0.0.1', true],
      ['127.255.255.255', true],
      ['10.0.0.1', true],
      ['10.255.255.255', true],
      ['172.16.0.1', true],
      ['172.31.255.255', true],
      ['192.168.0.1', true],
      ['192.168.255.255', true],
      ['169.254.169.254', true],
      ['0.0.0.0', true],
    ])('should return true for %s', (ip, expected) => {
      expect(isPrivateIp(ip)).toBe(expected);
    });
  });

  describe('IPv4 public addresses', () => {
    it.each([
      ['8.8.8.8', false],
      ['93.184.216.34', false],
      ['172.15.255.255', false],
      ['172.32.0.1', false],
      ['192.167.1.1', false],
      ['1.1.1.1', false],
    ])('should return false for %s', (ip, expected) => {
      expect(isPrivateIp(ip)).toBe(expected);
    });
  });

  describe('IPv6', () => {
    it.each([
      ['::1', true],
      ['::', true],
      ['[::1]', true],
      ['fc00::1', true],
      ['fd12:3456::1', true],
      ['fe80::1', true],
    ])('should return true for private %s', (ip, expected) => {
      expect(isPrivateIp(ip)).toBe(expected);
    });
  });

  describe('IPv4-mapped IPv6', () => {
    it.each([
      ['::ffff:127.0.0.1', true],
      ['::ffff:10.0.0.1', true],
      ['::ffff:192.168.1.1', true],
      ['::ffff:8.8.8.8', false],
      ['::ffff:93.184.216.34', false],
    ])('should handle %s correctly', (ip, expected) => {
      expect(isPrivateIp(ip)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return false for invalid octets', () => {
      expect(isPrivateIp('999.999.999.999')).toBe(false);
    });

    it('should return false for non-IP strings', () => {
      expect(isPrivateIp('example.com')).toBe(false);
    });
  });
});
