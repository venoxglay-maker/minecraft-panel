import { NextRequest, NextResponse } from 'next/server';
import { readUsers, writeUsers } from '@/lib/dataServer';
import { hashPassword } from '@/lib/authServer';
import { getCurrentApiUser } from '@/lib/authApi';

/** Benutzer aktualisieren (Rolle, Rechte, Server) oder löschen – nur Admin. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ message: 'Nur für Admins' }, { status: 403 });

  const { username } = await params;
  if (username === me.username) {
    return NextResponse.json({ message: 'Eigenen Benutzer nicht bearbeiten.' }, { status: 400 });
  }

  const data = await readUsers();
  if (data.admin?.username === username) {
    return NextResponse.json({ message: 'Admin kann nicht bearbeitet werden.' }, { status: 400 });
  }

  const index = data.users.findIndex((u) => u.username === username);
  if (index === -1) return NextResponse.json({ message: 'Benutzer nicht gefunden.' }, { status: 404 });

  try {
    const body = await req.json();
    if (body.role !== undefined) data.users[index].role = body.role === 'admin' ? 'admin' : 'user';
    if (body.permissions !== undefined) data.users[index].permissions = body.permissions;
    if (body.serverSlugs !== undefined) data.users[index].serverSlugs = body.serverSlugs;
    if (typeof body.password === 'string' && body.password.length >= 6) {
      data.users[index].passwordHash = hashPassword(body.password);
    }
    await writeUsers(data);
    const u = data.users[index];
    return NextResponse.json({ username: u.username, name: u.name, role: u.role, permissions: u.permissions, serverSlugs: u.serverSlugs });
  } catch {
    return NextResponse.json({ message: 'Ungültige Anfrage.' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ message: 'Nur für Admins' }, { status: 403 });

  const { username } = await params;
  if (username === me.username) {
    return NextResponse.json({ message: 'Eigenen Benutzer nicht löschen.' }, { status: 400 });
  }

  const data = await readUsers();
  if (data.admin?.username === username) {
    return NextResponse.json({ message: 'Admin kann nicht gelöscht werden.' }, { status: 400 });
  }

  const index = data.users.findIndex((u) => u.username === username);
  if (index === -1) return NextResponse.json({ message: 'Benutzer nicht gefunden.' }, { status: 404 });

  data.users.splice(index, 1);
  await writeUsers(data);
  return NextResponse.json({ ok: true });
}
