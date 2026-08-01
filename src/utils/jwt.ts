type JwtPayload = Record<string, unknown>;

// Decode JWT payload only (no signature validation on the client).
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    return parsed && typeof parsed === 'object' ? (parsed as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function getUsernameFromJwt(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const claimKeys = [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    'unique_name',
    'name',
    'sub',
  ];

  for (const key of claimKeys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}
