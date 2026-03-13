import { NextRequest, NextResponse } from 'next/server';
import { readUsers, writeUsers, type StoredUser } from '@/lib/dataServer';
import { hashPassword } from '@/lib/authServer';
import { getCurrentApiUser } from '@/lib/authApi';

/** Liste aller Benutzer (ohne Passwort) – nur für Admin. */
export async function GET() {
  const me = await getCurrentApiUser();
  if (!me) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  }
  if (me.role !== 'admin') {
    return NextResponse.json({ message: 'Nur für Admins' }, { status: 403 });
  }
  const data = await readUsers();
  const list = [
    ...(data.admin ? [{ username: data.admin.username, name: data.admin.username, role: 'admin' as const, serverSlugs: ['*'] }] : []),
    ...data.users.filter((u) => u.username !== data.admin?.username).map((u) => ({ username: u.username, name: u.name, role: u.role, permissions: u.permissions, serverSlugs: u.serverSlugs })),
  ];
  return NextResponse.json(list);
}

/** Neuen Benutzer anlegen – nur Admin. */
export async function POST(req: NextRequest) {
  const me = await getCurrentApiUser();
  if (!me) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  }
  if (me.role !== 'admin') {
    return NextResponse.json({ message: 'Nur für Admins' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const role = body.role === 'admin' ? 'admin' : 'user';
    const permissions = Array.isArray(body.permissions) ? body.permissions : undefined;
    const serverSlugs = Array.isArray(body.serverSlugs) ? body.serverSlugs : [];

    if (!username || password.length < 6) {
      return NextResponse.json({ message: 'Benutzername und Passwort (min. 6 Zeichen) erforderlich.' }, { status: 400 });
    }

    const data = await readUsers();
    const exists = data.admin?.username === username || data.users.some((u) => u.username === username);
    if (exists) {
      return NextResponse.json({ message: 'Benutzername existiert bereits.' }, { status: 400 });
    }

    const newUser: StoredUser = {
      username,
      passwordHash: hashPassword(password),
      name: name || undefined,
      role,
      permissions: role === 'user' ? permissions : undefined,
      serverSlugs: role === 'admin' || serverSlugs.includes('*') ? ['*'] : serverSlugs,
    };
    data.users.push(newUser);
    await writeUsers(data);

    return NextResponse.json({
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      permissions: newUser.permissions,
      serverSlugs: newUser.serverSlugs,
    });
  } catch (e) {
    return NextResponse.json({ message: 'Fehler beim Anlegen.' }, { status: 500 });
  }
}
