import { NextRequest, NextResponse } from 'next/server';
import { readUsers } from '@/lib/dataServer';
import { verifyPassword } from '@/lib/authServer';
import { createSession, SESSION_COOKIE } from '@/lib/authServer';

export async function POST(req: NextRequest) {
  try {
    const data = await readUsers();
    if (!data.admin) {
      return NextResponse.json(
        { message: 'Zuerst Einrichtung durchführen.' },
        { status: 400 }
      );
    }
    const body = await req.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Benutzername und Passwort erforderlich.' },
        { status: 400 }
      );
    }

    let match = false;
    let user: { username: string; name?: string; role: string; serverSlugs?: string[] } | null = null;

    if (data.admin.username === username && verifyPassword(password, data.admin.passwordHash)) {
      match = true;
      user = { username: data.admin.username, role: 'admin', serverSlugs: ['*'] };
    }
    if (!match) {
      const u = data.users.find((x) => x.username === username);
      if (u && verifyPassword(password, u.passwordHash)) {
        match = true;
        user = {
          username: u.username,
          name: u.name,
          role: u.role,
          serverSlugs: u.serverSlugs,
        };
      }
    }

    if (!match || !user) {
      return NextResponse.json(
        { message: 'Benutzername oder Passwort falsch.' },
        { status: 401 }
      );
    }

    const sessionId = createSession(username);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
  }
}
