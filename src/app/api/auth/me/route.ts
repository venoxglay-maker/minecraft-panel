import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readUsers } from '@/lib/dataServer';
import { getSession, SESSION_COOKIE } from '@/lib/authServer';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const username = sessionId ? getSession(sessionId) : null;
  if (!username) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  }
  const data = await readUsers();
  if (data.admin?.username === username) {
    return NextResponse.json({
      username: data.admin.username,
      name: data.admin.username,
      role: 'admin',
      serverSlugs: ['*'],
    });
  }
  const u = data.users.find((x) => x.username === username);
  if (!u) {
    return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 401 });
  }
  return NextResponse.json({
    username: u.username,
    name: u.name,
    role: u.role,
    permissions: u.permissions,
    serverSlugs: u.serverSlugs,
  });
}
