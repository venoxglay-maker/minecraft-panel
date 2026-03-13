'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Benutzername eingeben.');
      return;
    }
    if (password.length < 6) {
      setError('Passwort mindestens 6 Zeichen.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Einrichtung fehlgeschlagen.');
        return;
      }
      router.refresh();
      router.replace('/');
    } catch {
      setError('Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-panel-bg p-4">
      <div className="w-full max-w-md rounded-xl border border-panel-border bg-panel-card p-8">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <Shield className="h-8 w-8 text-panel-green" />
          <span className="text-xl font-semibold">LaxPanel – Einrichtung</span>
        </div>
        <p className="mb-6 text-center text-sm text-panel-muted">
          Beim ersten Start musst du einen Admin-Account anlegen. Mit diesem Account kannst du später weitere Benutzer anlegen und Rechte vergeben.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white">Admin-Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              placeholder="z. B. admin"
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
              placeholder="Mind. 6 Zeichen"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              placeholder="Passwort wiederholen"
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-panel-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-panel-accent py-2.5 text-sm font-medium text-white hover:bg-panel-accent-hover disabled:opacity-50"
          >
            {loading ? 'Wird angelegt…' : 'Admin-Account anlegen'}
          </button>
        </form>
      </div>
    </div>
  );
}
