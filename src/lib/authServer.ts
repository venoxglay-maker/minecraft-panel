/**
 * Server-seitige Auth: Passwort-Hashing und Session-Prüfung.
 * Nur in API Routes verwenden.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 32;
const SESSION_SECRET = process.env.SESSION_SECRET || 'laxpanel-default-change-in-production';

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = scryptSync(password, salt, KEY_LEN);
    const storedHash = Buffer.from(hashHex, 'hex');
    return timingSafeEqual(hash, storedHash);
  } catch {
    return false;
  }
}

const sessions = new Map<string, { username: string; createdAt: number }>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export function createSession(username: string): string {
  const id = randomBytes(24).toString('hex');
  sessions.set(id, { username, createdAt: Date.now() });
  return id;
}

export function getSession(sessionId: string): string | null {
  const s = sessions.get(sessionId);
  if (!s) return null;
  if (Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return s.username;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export const SESSION_COOKIE = 'laxpanel_session';
