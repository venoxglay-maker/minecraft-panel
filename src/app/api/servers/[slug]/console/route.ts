import { NextRequest, NextResponse } from 'next/server';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';
import { getConsoleLogs, sendConsoleCommand } from '@/lib/minecraftRunner';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const logs = getConsoleLogs(slug);
  return NextResponse.json({ lines: logs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const command = typeof body.command === 'string' ? body.command.trim() : '';
  if (!command) return NextResponse.json({ message: 'Befehl fehlt.' }, { status: 400 });
  const ok = sendConsoleCommand(slug, command);
  return NextResponse.json({ ok });
}
