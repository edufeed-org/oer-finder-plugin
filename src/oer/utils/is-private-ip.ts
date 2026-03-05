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

  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 10.0.0.0/8 — private
  if (a === 10) return true;
  // 172.16.0.0/12 — private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 — link-local (AWS/GCP/Azure metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8
  if (a === 0) return true;

  return false;
}
