// Browser-side password hashing using Web Crypto SHA-256 + per-deployment salt.
// NOTE: This is appropriate for a browser-only EMR demo with no server. For a
// production deployment with a backend, replace with server-side bcrypt/argon2.

const APP_SALT = 'moromoke-emr-v1';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(APP_SALT + ':' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const candidate = await hashPassword(password);
  // Constant-time-ish comparison (length is fixed for SHA-256 hex)
  if (candidate.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// Pre-computed SHA-256 of "moromoke-emr-v1:password" — every demo account
// ships with this default. Users are flagged mustChangePassword=true and
// prompted to change it after first login.
export const DEFAULT_PASSWORD = 'password';
export const DEFAULT_PASSWORD_HASH = 'e998a90e5f44599f43cbd3319578dfb734b306a62d62ef8ea0d6e5cfc431d7c3';

export function validatePasswordStrength(pw: string): { valid: boolean; reason?: string } {
  if (pw.length < 8) return { valid: false, reason: 'Password must be at least 8 characters' };
  if (!/[A-Za-z]/.test(pw)) return { valid: false, reason: 'Password must contain at least one letter' };
  if (!/\d/.test(pw)) return { valid: false, reason: 'Password must contain at least one number' };
  return { valid: true };
}
