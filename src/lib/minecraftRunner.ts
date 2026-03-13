/**
 * Echte Minecraft-Server: Erstellung, Start, Stop, Konsole, Metriken.
 * Nur auf dem Server (Node) verwenden.
 */

import { spawn, type ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { ServerItem } from './servers';
import { readServers, writeServers, appendActivity } from './dataServer';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVERS_DIR = path.join(DATA_DIR, 'servers');
const MAX_LOG_LINES = 2000;

interface RunningServer {
  process: ChildProcess;
  logs: string[];
}

const running = new Map<string, RunningServer>();

function getServerDir(slug: string): string {
  return path.join(SERVERS_DIR, slug);
}

/** Server-JAR-URL von Mojang für eine Version holen */
export async function getServerJarUrl(version: string): Promise<string> {
  const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  const manifest = await manifestRes.json();
  const versionEntry = manifest.versions?.find((v: { id: string }) => v.id === version);
  if (!versionEntry?.url) throw new Error(`Version ${version} nicht gefunden`);
  const versionRes = await fetch(versionEntry.url);
  const versionJson = await versionRes.json();
  const serverUrl = versionJson.downloads?.server?.url;
  if (!serverUrl) throw new Error(`Server-JAR für ${version} nicht gefunden`);
  return serverUrl;
}

/** Server-Verzeichnis anlegen, JAR herunterladen, eula.txt und server.properties schreiben */
export async function setupServer(
  slug: string,
  version: string,
  port: number,
  maxPlayers: number,
  _memoryMb: number
): Promise<string> {
  const dir = getServerDir(slug);
  await fs.mkdir(dir, { recursive: true });

  const jarPath = path.join(dir, 'server.jar');
  try {
    await fs.access(jarPath);
  } catch {
    const url = await getServerJarUrl(version);
    const res = await fetch(url);
    if (!res.ok) throw new Error('JAR-Download fehlgeschlagen');
    const buf = await res.arrayBuffer();
    await fs.writeFile(jarPath, Buffer.from(buf));
  }

  const eulaPath = path.join(dir, 'eula.txt');
  await fs.writeFile(eulaPath, 'eula=true\n', 'utf-8');

  const propsPath = path.join(dir, 'server.properties');
  const props = [
    'server-port=' + port,
    'max-players=' + maxPlayers,
    'online-mode=true',
    'motd=LaxPanel',
  ].join('\n');
  try {
    const existing = await fs.readFile(propsPath, 'utf-8');
    const updated = existing.replace(/server-port=\d+/, 'server-port=' + port).replace(/max-players=\d+/, 'max-players=' + maxPlayers);
    await fs.writeFile(propsPath, updated, 'utf-8');
  } catch {
    await fs.writeFile(propsPath, props + '\n', 'utf-8');
  }

  return dir;
}

/** Minecraft-Server-Prozess starten */
export async function startServer(slug: string): Promise<{ pid: number }> {
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (!server?.workDir) throw new Error('Server nicht eingerichtet oder workDir fehlt');
  if (running.has(slug)) throw new Error('Server läuft bereits');

  const memoryMb = server.memoryMb ?? 2048;
  const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java') : 'java';
  const child = spawn(
    java,
    [`-Xmx${memoryMb}M`, '-Xms128M', '-jar', 'server.jar', 'nogui'],
    { cwd: server.workDir, stdio: ['pipe', 'pipe', 'pipe'] }
  );

  const logs: string[] = [];
  const push = (line: string) => {
    logs.push(line);
    if (logs.length > MAX_LOG_LINES) logs.shift();
  };

  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString('utf-8').trim();
    text.split('\n').forEach((l) => push(l || ''));
  });
  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString('utf-8').trim();
    text.split('\n').forEach((l) => push('[stderr] ' + (l || '')));
  });

  child.on('exit', (code) => {
    running.delete(slug);
    push(`[Prozess beendet mit Code ${code}]`);
    readServers().then((list) => {
      const s = list.find((x) => x.slug === slug);
      if (s) {
        s.status = 'stopped';
        s.pid = undefined;
        writeServers(list);
      }
    });
  });

  const pid = child.pid;
  if (!pid) throw new Error('Prozess konnte nicht gestartet werden');
  running.set(slug, { process: child, logs });

  server.status = 'running';
  server.pid = pid;
  await writeServers(servers);
  await appendActivity({ text: `${server.name} gestartet`, slug, type: 'start' });
  return { pid };
}

/** Server stoppen */
export async function stopServer(slug: string): Promise<void> {
  const run = running.get(slug);
  if (run) {
    run.process.kill('SIGTERM');
    running.delete(slug);
  }
  const servers = await readServers();
  const server = servers.find((s) => s.slug === slug);
  if (server) {
    server.status = 'stopped';
    server.pid = undefined;
    await writeServers(servers);
    await appendActivity({ text: `${server.name} gestoppt`, slug, type: 'stop' });
  }
}

/** Befehl an die Konsole senden */
export function sendConsoleCommand(slug: string, command: string): boolean {
  const run = running.get(slug);
  if (!run?.process.stdin?.writable) return false;
  run.process.stdin.write(command.trim() + '\n');
  run.logs.push('> ' + command.trim());
  if (run.logs.length > MAX_LOG_LINES) run.logs.shift();
  return true;
}

/** Letzte Log-Zeilen abrufen */
export function getConsoleLogs(slug: string): string[] {
  const run = running.get(slug);
  return run ? [...run.logs] : [];
}

/** Echte CPU- und RAM-Nutzung für einen Prozess (pidusage oder /proc) */
export async function getProcessStats(pid: number): Promise<{ cpu: number; memoryMb: number } | null> {
  try {
    const pidusage = (await import('pidusage')).default;
    const stats = await pidusage(pid);
    const memoryMb = Math.round((stats.memory || 0) / 1024 / 1024);
    const cpu = typeof stats.cpu === 'number' ? Math.round(stats.cpu) : 0;
    return { cpu, memoryMb };
  } catch {
    try {
      const status = await fs.readFile(`/proc/${pid}/status`, 'utf-8');
      const vmRss = status.match(/VmRSS:\s*(\d+)\s*kB/);
      const memoryMb = vmRss ? Math.round(parseInt(vmRss[1], 10) / 1024) : 0;
      return { cpu: 0, memoryMb };
    } catch {
      return null;
    }
  }
}
