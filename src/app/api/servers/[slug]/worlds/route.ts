import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { readServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';

function safeDir(base: string, name: string): string | null {
  const n = path.normalize(name).replace(/^(\.\.(\/|\\|$))+/, '');
  if (n.includes('..') || path.isAbsolute(n)) return null;
  const resolved = path.join(base, n);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

/** Liste der Welt-Ordner im Server-Verzeichnis (world*, level-name aus server.properties) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server?.workDir) return NextResponse.json({ message: 'Server nicht gefunden.' }, { status: 404 });

  try {
    const entries = await fs.readdir(server.workDir, { withFileTypes: true });
    const worldDirs = entries.filter((e) => e.isDirectory() && (e.name === 'world' || e.name.startsWith('world_') || e.name.endsWith('_nether') || e.name.endsWith('_the_end')));
    const result = worldDirs.map((e) => ({
      id: e.name,
      name: e.name,
      size: '–',
      lastPlayed: '–',
    }));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}

/** Welt-Ordner löschen */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server?.workDir) return NextResponse.json({ message: 'Server nicht gefunden.' }, { status: 404 });

  const name = req.nextUrl.searchParams.get('name');
  if (!name) return NextResponse.json({ message: 'name erforderlich.' }, { status: 400 });
  const dir = safeDir(server.workDir, name);
  if (!dir) return NextResponse.json({ message: 'Ungültiger Ordnername.' }, { status: 400 });
  // Nur bekannte Welt-Muster erlauben
  const baseName = path.basename(dir);
  if (baseName !== 'world' && !baseName.startsWith('world_') && !baseName.endsWith('_nether') && !baseName.endsWith('_the_end')) {
    return NextResponse.json({ message: 'Nur Welt-Ordner (world, world_nether, …) dürfen gelöscht werden.' }, { status: 400 });
  }
  try {
    await fs.rm(dir, { recursive: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Löschen fehlgeschlagen.' }, { status: 500 });
  }
}
