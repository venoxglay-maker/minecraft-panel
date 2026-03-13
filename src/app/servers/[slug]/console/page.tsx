'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import type { ServerItem } from '@/lib/servers';

export default function ConsolePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [server, setServer] = useState<ServerItem | null>(null);
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch('/api/servers', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: ServerItem[]) => setServer(data.find((s) => s.slug === slug) ?? null))
      .catch(() => setServer(null));
  }, [slug]);

  const fetchLogs = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/servers/${slug}/console`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLines(Array.isArray(data.lines) ? data.lines : []);
      }
    } catch {
      setLines([]);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, [slug, fetchLogs]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  const sendCommand = async () => {
    const cmd = input.trim();
    if (!cmd || sending) return;
    setInput('');
    setSending(true);
    try {
      const res = await fetch(`/api/servers/${slug}/console`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        await fetchLogs();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-280px)] flex-col p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Console</h2>
          <p className="text-sm text-panel-muted">Live-Log und Befehle direkt an den Minecraft-Server.</p>
        </div>
        <span className={cn('flex items-center gap-2 text-sm', server ? getStatusColor(server.status) : 'text-panel-muted')}>
          <Circle className={cn('h-2 w-2 shrink-0 rounded-full', server?.status === 'running' ? 'fill-panel-green text-panel-green' : server?.status === 'stopping' || server?.status === 'starting' ? 'fill-amber-400 text-amber-400' : 'fill-panel-red text-panel-red')} />
          {server ? getStatusLabel(server.status) : '–'}
        </span>
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-panel-border bg-black/60 font-mono text-sm">
        {lines.length === 0 && (
          <div className="px-3 py-2 text-panel-muted">Keine Konsolenausgabe. Starte den Server, um Logs zu sehen.</div>
        )}
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2 border-b border-panel-border/30 px-3 py-1">
            <span className={cn(
              'shrink-0',
              line.startsWith('[stderr]') ? 'text-amber-400' : line.startsWith('>') ? 'text-panel-blue' : 'text-green-400'
            )}>
              {line}
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
            placeholder="Befehl eingeben..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendCommand();
              }
            }}
            disabled={server?.status !== 'running'}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-panel-muted disabled:opacity-50"
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
          {server?.status !== 'running' && (
            <span className="text-amber-400">Server muss laufen, um Befehle zu senden.</span>
          )}
        </div>
      </div>
    </div>
  );
}
