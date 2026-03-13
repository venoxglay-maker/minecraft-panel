'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import type { ServerItem } from '@/lib/servers';

type LogEntry = { time: string; level: string; msg: string };

const initialLogs: LogEntry[] = [
  { time: '2025-08-12T03:47:03', level: 'info', msg: 'Starting Backup' },
  { time: '2025-08-12T03:47:04', level: 'info', msg: 'Server Backup done!' },
  { time: '2025-08-12T03:47:05', level: 'info', msg: 'Loaded 28 custom command functions.' },
  { time: '2025-08-12T03:47:06', level: 'info', msg: '[Server thread] Server started.' },
];

function formatTime() {
  return new Date().toISOString().slice(0, 23);
}

export default function ConsolePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [server, setServer] = useState<ServerItem | null>(null);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lineLimit, setLineLimit] = useState('500');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch('/api/servers')
      .then((r) => r.json())
      .then((data: ServerItem[]) => setServer(data.find((s) => s.slug === slug) ?? null))
      .catch(() => setServer(null));
  }, [slug]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const sendCommand = () => {
    const cmd = input.trim();
    if (!cmd) return;
    setInput('');
    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'info', msg: `> ${cmd}` },
      { time: formatTime(), level: 'info', msg: 'Command sent (demo).' },
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Console</h2>
          <p className="text-sm text-panel-muted">Live-Log und Befehle direkt an den Server senden.</p>
        </div>
        <span className={cn('flex items-center gap-2 text-sm', server ? getStatusColor(server.status) : 'text-panel-muted')}>
          <Circle className={cn('h-2 w-2 shrink-0 rounded-full', server?.status === 'running' ? 'fill-panel-green text-panel-green' : server?.status === 'stopping' || server?.status === 'starting' ? 'fill-amber-400 text-amber-400' : 'fill-panel-red text-panel-red')} />
          {server ? getStatusLabel(server.status) : '–'}
        </span>
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-panel-border bg-black/60 font-mono text-sm">
        {logs.map((l, i) => (
          <div key={i} className="flex gap-2 border-b border-panel-border/30 px-3 py-1">
            <span className="shrink-0 text-panel-muted">{l.time}</span>
            <span
              className={
                l.level === 'info'
                  ? 'text-green-400'
                  : l.level === 'warn'
                    ? 'text-amber-400'
                    : 'text-panel-red'
              }
            >
              {l.msg}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-3 py-2">
          <span className="text-panel-muted">$</span>
          <input
            type="text"
            placeholder="Enter command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendCommand();
              }
            }}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-panel-muted"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-panel-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-Scroll
          </label>
          <select
            value={lineLimit}
            onChange={(e) => setLineLimit(e.target.value)}
            className="rounded border border-panel-border bg-panel-card px-2 py-1 text-white"
          >
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
          <span className="text-xs">lines</span>
        </div>
      </div>
    </div>
  );
}
