import { NextRequest, NextResponse } from 'next/server';
import { readServers, writeServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';
import { setupServer } from '@/lib/minecraftRunner';
import { appendActivity } from '@/lib/dataServer';
import type { ServerItem } from '@/lib/servers';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function GET() {
  const me = await getCurrentApiUser();
  const servers = await readServers();
  const filtered = me ? servers.filter((s) => canAccessServer(me, s.slug)) : [];
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ message: 'Nur Admins können Server anlegen.' }, { status: 403 });
  try {
    const servers = await readServers();
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { message: 'Server-Name ist erforderlich.' },
        { status: 400 }
      );
    }
    const slug = slugify(name) || `server-${Date.now()}`;
    const existing = servers.some((s) => s.slug === slug);
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const memoryMb = typeof body.memoryMb === 'number' ? body.memoryMb : 2048;
    const maxPlayers = typeof body.maxPlayers === 'number' ? body.maxPlayers : 20;
    const mcVersion = typeof body.mcVersion === 'string' ? body.mcVersion : '1.21.1';
    const port = typeof body.port === 'number' ? body.port : 25565 + servers.length;

    const newServer: ServerItem = {
      name,
      slug: finalSlug,
      version: mcVersion,
      players: `0/${maxPlayers}`,
      playersOnline: 0,
      playersMax: maxPlayers,
      tps: '20.0',
      status: 'installing',
      port,
      memoryMb,
      workDir: undefined,
    };

    servers.push(newServer);
    await writeServers(servers);

    try {
      const workDir = await setupServer(finalSlug, mcVersion, port, maxPlayers, memoryMb);
      newServer.workDir = workDir;
      newServer.status = 'stopped';
      await writeServers(servers);
      await appendActivity({ text: `Server „${name}“ erstellt`, slug: finalSlug, type: 'create' });
    } catch (err) {
      newServer.status = 'stopped';
      await writeServers(servers);
      const msg = err instanceof Error ? err.message : 'Installation fehlgeschlagen';
      return NextResponse.json({ message: 'Server angelegt, aber JAR-Setup fehlgeschlagen: ' + msg, server: newServer }, { status: 200 });
    }

    return NextResponse.json(newServer);
  } catch (e) {
    return NextResponse.json(
      { message: 'Ungültige Anfrage.' },
      { status: 400 }
    );
  }
}
