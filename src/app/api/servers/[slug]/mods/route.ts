import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { readServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';

function safePath(base: string, ...parts: string[]): string | null {
  const joined = path.join(base, ...parts);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(path.resolve(base)) || normalized === path.resolve(base)) return null;
  return normalized;
}

/** Liste der Mod-JARs im mods-Ordner */
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

  const modsDir = path.join(server.workDir, 'mods');
  try {
    await fs.mkdir(modsDir, { recursive: true });
  } catch {
    // ignore
  }
  try {
    const entries = await fs.readdir(modsDir, { withFileTypes: true });
    const mods = entries
      .filter((e) => e.isFile() && (e.name.endsWith('.jar') || e.name.endsWith('.jar.disabled')))
      .map((e) => {
        const name = e.name.endsWith('.jar.disabled') ? e.name.replace(/\.jar\.disabled$/, '') : e.name.replace(/\.jar$/, '');
        return { id: e.name, name, version: '–', fileName: e.name };
      });
    return NextResponse.json(mods);
  } catch {
    return NextResponse.json([]);
  }
}

/** Mod-Datei löschen */
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

  const fileName = req.nextUrl.searchParams.get('file');
  if (!fileName) return NextResponse.json({ message: 'file erforderlich.' }, { status: 400 });
  if (!fileName.endsWith('.jar') && !fileName.endsWith('.jar.disabled')) {
    return NextResponse.json({ message: 'Nur .jar-Dateien.' }, { status: 400 });
  }
  const filePath = safePath(server.workDir, 'mods', fileName);
  if (!filePath) return NextResponse.json({ message: 'Ungültiger Dateiname.' }, { status: 400 });
  try {
    await fs.unlink(filePath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'Löschen fehlgeschlagen.' }, { status: 500 });
  }
}

/** Mod von Modrinth herunterladen und in mods/ speichern */
export async function POST(
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
  const projectId = body.projectId ?? body.project_id;
  const versionId = body.versionId ?? body.version_id;
  if (!projectId) return NextResponse.json({ message: 'projectId (Modrinth project id) erforderlich.' }, { status: 400 });

  try {
    const base = 'https://api.modrinth.com/v2';
    let url: string;
    if (versionId) {
      const vRes = await fetch(`${base}/version/${versionId}`, {
        headers: { 'User-Agent': 'LaxPanel/1.0' },
      });
      if (!vRes.ok) throw new Error('Version nicht gefunden');
      const v = await vRes.json();
      const file = v.files?.find((f: { primary?: boolean }) => f.primary) ?? v.files?.[0];
      if (!file?.url) throw new Error('Keine Datei in Version');
      url = file.url;
    } else {
      const pRes = await fetch(`${base}/project/${projectId}/version`, {
        headers: { 'User-Agent': 'LaxPanel/1.0' },
      });
      if (!pRes.ok) throw new Error('Projekt nicht gefunden');
      const versions = await pRes.json();
      const v = versions[0];
      if (!v) throw new Error('Keine Version gefunden');
      const file = v.files?.find((f: { primary?: boolean }) => f.primary) ?? v.files?.[0];
      if (!file?.url) throw new Error('Keine Datei');
      url = file.url;
    }
    const res = await fetch(url, { headers: { 'User-Agent': 'LaxPanel/1.0' } });
    if (!res.ok) throw new Error('Download fehlgeschlagen');
    const buf = await res.arrayBuffer();
    const fileName = url.split('/').pop()?.split('?')[0] || `${projectId}.jar`;
    const modsDir = path.join(server.workDir, 'mods');
    await fs.mkdir(modsDir, { recursive: true });
    const outPath = path.join(modsDir, fileName);
    await fs.writeFile(outPath, Buffer.from(buf));
    return NextResponse.json({ ok: true, file: fileName });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Mod hinzufügen fehlgeschlagen';
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
