import { cookies } from 'next/headers';
import { getSession, SESSION_COOKIE } from './authServer';
import { readUsers } from './dataServer';

export type ApiUser = {
  username: string;
  name?: string;
  role: 'admin' | 'user';
  permissions?: string[];
  serverSlugs?: string[];
};

/** Liest den aktuellen Benutzer aus der Session (für API Routes). */
export async function getCurrentApiUser(): Promise<ApiUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const username = sessionId ? getSession(sessionId) : null;
  if (!username) return null;
  const data = await readUsers();
  if (data.admin?.username === username) {
    return { username: data.admin.username, name: data.admin.username, role: 'admin', serverSlugs: ['*'] };
  }
  const u = data.users.find((x) => x.username === username);
  if (!u) return null;
  return {
    username: u.username,
    name: u.name,
    role: u.role,
    permissions: u.permissions,
    serverSlugs: u.serverSlugs,
  };
}

export function canAccessServer(user: ApiUser | null, slug: string): boolean {
  if (!user) return true;
  if (user.role === 'admin') return true;
  const slugs = user.serverSlugs ?? [];
  return slugs.includes('*') || slugs.includes(slug);
}
