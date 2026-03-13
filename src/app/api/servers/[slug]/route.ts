import { NextRequest, NextResponse } from 'next/server';
import { readServers, writeServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';
import { startServer, stopServer } from '@/lib/minecraftRunner';
import { appendActivity } from '@/lib/dataServer';
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
    if (!status || !['running', 'stopped', 'starting', 'stopping'].includes(status)) {
      return NextResponse.json({ message: 'Ungültiger Status.' }, { status: 400 });
    }

    if (status === 'running') {
      server.status = 'starting';
      await writeServers(servers);
      try {
        const { pid } = await startServer(slug);
        server.pid = pid;
        server.status = 'running';
        server.playersOnline = 0;
        await writeServers(servers);
      } catch (err) {
        server.status = 'stopped';
        await writeServers(servers);
        const msg = err instanceof Error ? err.message : 'Start fehlgeschlagen';
        return NextResponse.json({ message: msg }, { status: 500 });
      }
    }

    if (status === 'stopped') {
      server.status = 'stopping';
      await writeServers(servers);
      await stopServer(slug);
      server.status = 'stopped';
      server.pid = undefined;
      await writeServers(servers);
    }

    return NextResponse.json(server);
  } catch (e) {
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
  await stopServer(slug);
  const { promises: fs } = await import('fs');
  const pathMod = await import('path');
  const dir = pathMod.join(process.cwd(), 'data', 'servers', slug);
  try {
    await fs.rm(dir, { recursive: true });
  } catch {
    // Verzeichnis vielleicht schon weg
  }
  const deletedName = servers[index].name;
  servers.splice(index, 1);
  await writeServers(servers);
  await appendActivity({ text: `Server „${deletedName}“ gelöscht`, slug, type: 'delete' });
  return NextResponse.json({ ok: true });
}
