import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { readServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';

function resolveDir(workDir: string, subPath: string): string {
  const normalized = path.normalize(subPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(workDir, normalized);
  if (!resolved.startsWith(path.resolve(workDir))) return workDir;
  return resolved;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server?.workDir) return NextResponse.json({ message: 'Server oder Verzeichnis nicht gefunden.' }, { status: 404 });
  const search = req.nextUrl.searchParams;
  const subPath = search.get('path') ?? '';

  try {
    const dir = resolveDir(server.workDir, subPath);
    const stat = await fs.stat(dir);
    if (stat.isFile()) {
      const content = await fs.readFile(dir, 'utf-8').catch(() => '');
      return NextResponse.json({ type: 'file', path: subPath || path.basename(dir), content });
    }
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const list = entries.map((e) => ({
      name: e.name,
      path: subPath ? `${subPath}/${e.name}` : e.name,
      type: e.isDirectory() ? 'folder' as const : 'file' as const,
    }));
    return NextResponse.json({ type: 'dir', path: subPath || '', entries: list });
  } catch (err) {
    return NextResponse.json({ message: 'Datei/Ordner nicht lesbar.' }, { status: 404 });
  }
}

export async function PUT(
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
  const body = await req.json().catch(() => ({}));
  const filePath = typeof body.path === 'string' ? body.path.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';
  if (!filePath) return NextResponse.json({ message: 'path erforderlich.' }, { status: 400 });

  const fullPath = resolveDir(server.workDir, filePath);
  if (!fullPath.startsWith(path.resolve(server.workDir))) {
    return NextResponse.json({ message: 'Ungültiger Pfad.' }, { status: 400 });
  }
  try {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return NextResponse.json({ ok: true, path: filePath });
  } catch {
    return NextResponse.json({ message: 'Schreiben fehlgeschlagen.' }, { status: 500 });
  }
}
