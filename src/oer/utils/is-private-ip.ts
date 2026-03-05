/**
 * Checks if an IP address belongs to a private, reserved, or non-routable range.
 * Used for SSRF protection to block requests to internal network resources,
 * cloud metadata endpoints (169.254.x.x), and other special-purpose addresses.
 */
export function isPrivateIp(ip: string): boolean {
  // Strip IPv6 brackets
  const clean = ip.startsWith('[') ? ip.slice(1, -1) : ip;

  // IPv6 loopback
  if (clean === '::1' || clean === '::') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const v4Mapped = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const ipv4 = v4Mapped ? v4Mapped[1] : clean;

  const parts = ipv4.split('.');
  if (parts.length !== 4) {
    // Non-IPv4 that isn't loopback — could be a regular hostname or uncommon IPv6
    // For IPv6 ranges, check common private prefixes
    const lower = clean.toLowerCase();
    return (
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80')
    );
  }

  const octets = parts.map(Number);
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    return false;
  }

  const [a, b] = octets;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8 — private
  if (a === 10) return true;
  // 100.64.0.0/10 — CGN/shared address space (RFC 6598, used by cloud VPCs)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — link-local (AWS/GCP/Azure metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 — benchmarking (RFC 2544)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 240.0.0.0/4 — reserved
  if (a >= 240) return true;

  return false;
}
