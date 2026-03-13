'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/');
      return;
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Benutzername und Passwort eingeben.');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Anmeldung fehlgeschlagen.');
        return;
      }
      await refresh();
      router.refresh();
      router.replace('/');
    } catch {
      setError('Verbindungsfehler.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel-bg">
        <p className="text-panel-muted">Lade…</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-panel-bg p-4">
      <div className="w-full max-w-md rounded-xl border border-panel-border bg-panel-card p-8">
        <h1 className="mb-2 text-center text-xl font-semibold text-white">LaxPanel</h1>
        <p className="mb-6 text-center text-sm text-panel-muted">Mit deinen Zugangsdaten anmelden</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              placeholder="Benutzername"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              placeholder="Passwort"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-panel-red">{error}</p>}
          <button
            type="submit"
            disabled={submitLoading}
            className="w-full rounded-lg bg-panel-accent py-2.5 text-sm font-medium text-white hover:bg-panel-accent-hover disabled:opacity-50"
          >
            {submitLoading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-panel-muted">
          Noch keinen Admin? <Link href="/setup" className="text-amber-400 hover:underline">Einrichtung starten</Link>
        </p>
      </div>
    </div>
  );
}
