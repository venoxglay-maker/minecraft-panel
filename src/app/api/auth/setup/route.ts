import { NextRequest, NextResponse } from 'next/server';
import { readUsers, writeUsers } from '@/lib/dataServer';
import { hashPassword } from '@/lib/authServer';
import { createSession, SESSION_COOKIE } from '@/lib/authServer';

export async function POST(req: NextRequest) {
  try {
    const data = await readUsers();
    if (data.admin) {
      return NextResponse.json(
        { message: 'Einrichtung wurde bereits durchgeführt.' },
        { status: 400 }
      );
    }
    const body = await req.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || password.length < 6) {
      return NextResponse.json(
        { message: 'Benutzername und Passwort (min. 6 Zeichen) erforderlich.' },
        { status: 400 }
      );
    }
    const passwordHash = hashPassword(password);
    data.admin = { username, passwordHash };
    data.users = [
      { username, passwordHash, name: username, role: 'admin', serverSlugs: ['*'] },
    ];
    await writeUsers(data);

    const sessionId = createSession(username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Fehler bei der Einrichtung.' }, { status: 500 });
  }
}
