import { NextResponse } from 'next/server';
import { readServers } from '@/lib/dataServer';
import { getCurrentApiUser, canAccessServer } from '@/lib/authApi';
import { getProcessStats } from '@/lib/minecraftRunner';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const { slug } = await params;
  if (!canAccessServer(me, slug)) return NextResponse.json({ message: 'Kein Zugriff.' }, { status: 403 });
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server) return NextResponse.json({ message: 'Server nicht gefunden.' }, { status: 404 });

  const memoryMb = server.memoryMb ?? 2048;
  let cpuPct = 0;
  let usedMemoryMb = 0;

  if (server.pid) {
    const stats = await getProcessStats(server.pid);
    if (stats) {
      usedMemoryMb = stats.memoryMb;
      cpuPct = Math.min(100, Math.round(stats.cpu));
    }
  }

  return NextResponse.json({
    cpu: cpuPct,
    memoryUsedMb: usedMemoryMb,
    memoryTotalMb: memoryMb,
    memoryPct: memoryMb > 0 ? Math.round((usedMemoryMb / memoryMb) * 100) : 0,
    playersOnline: server.playersOnline ?? 0,
    playersMax: server.playersMax ?? 20,
    tps: server.tps ?? '20.0',
  });
}
