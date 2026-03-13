import { NextRequest, NextResponse } from 'next/server';
import { readServers, writeServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';
import type { ServerStatus } from '@/lib/servers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff auf diesen Server.' }, { status: 403 });
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server) {
    return NextResponse.json({ message: 'Server nicht gefunden.' }, { status: 404 });
  }
  try {
    const body = await req.json();
    const status = body.status as ServerStatus | undefined;
    if (status && ['running', 'stopped', 'starting', 'stopping', 'installing'].includes(status)) {
      server.status = status;
      if (status === 'running') {
        server.playersOnline = 0;
      }
      await writeServers(servers);
      return NextResponse.json(server);
    }
    return NextResponse.json({ message: 'Ungültiger Status.' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: 'Ungültige Anfrage.' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ message: 'Nur Admins können Server löschen.' }, { status: 403 });
  const { slug } = await params;
  const servers = await readServers();
  const index = servers.findIndex((s) => s.slug === slug);
  if (index === -1) {
    return NextResponse.json({ message: 'Server nicht gefunden.' }, { status: 404 });
  }
  servers.splice(index, 1);
  await writeServers(servers);
  return NextResponse.json({ ok: true });
}
