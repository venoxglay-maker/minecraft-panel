import { NextRequest, NextResponse } from 'next/server';
import { getCurrentApiUser } from '@/lib/authApi';
import { readServers } from '@/lib/dataServer';
import { getProcessStats } from '@/lib/minecraftRunner';

export async function GET(req: NextRequest) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const servers = await readServers();
  const allowed = me.role === 'admin' || (me.serverSlugs ?? []).includes('*')
    ? servers
    : servers.filter((s) => (me.serverSlugs ?? []).includes(s.slug));

  let usedMemoryMb = 0;
  let cpuSum = 0;
  for (const s of allowed) {
    if (s.pid) {
      const stats = await getProcessStats(s.pid);
      if (stats) {
        usedMemoryMb += stats.memoryMb;
        cpuSum += stats.cpu;
      }
    }
  }
  const allocatedMb = allowed.reduce((acc, s) => acc + (s.memoryMb ?? 0), 0);

  let diskFree = '';
  try {
    const os = await import('os');
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    diskFree = `${(used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(total / 1024 / 1024 / 1024).toFixed(2)} GB`;
  } catch {
    diskFree = '–';
  }

  let version = '0.0.1';
  try {
    const path = await import('path');
    const { promises: fs } = await import('fs');
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { version?: string };
    version = pkg.version ?? version;
  } catch {
    // keep default
  }

  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host') || '–';

  return NextResponse.json({
    totalServers: allowed.length,
    activeServers: allowed.filter((s) => s.status === 'running').length,
    totalPlayers: allowed.reduce((acc, s) => acc + (s.playersOnline ?? 0), 0),
    usedMemoryMb,
    allocatedMb,
    cpuPct: Math.round(cpuSum),
    diskFree,
    version,
    hostname,
  });
}
