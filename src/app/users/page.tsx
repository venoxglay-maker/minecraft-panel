'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users as UsersIcon, Plus, Trash2, Shield, User, Copy, RefreshCw, Server, LogIn, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { ServerItem } from '@/lib/servers';

type UserRole = 'admin' | 'user';
interface ApiUser {
  username: string;
  name?: string;
  role: UserRole;
  permissions?: string[];
  serverSlugs?: string[];
}

const PERMISSION_OPTIONS = [
  { id: 'servers', label: 'Server verwalten' },
  { id: 'files', label: 'Dateien bearbeiten' },
  { id: 'console', label: 'Konsole' },
  { id: 'mods', label: 'Mods/Modpacks' },
  { id: 'users', label: 'Benutzer verwalten' },
  { id: 'settings', label: 'Einstellungen' },
];

function generatePassword(length = 12): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => chars[b % chars.length]).join('');
}

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [newServerSlugs, setNewServerSlugs] = useState<string[]>([]);
  const [newAllServers, setNewAllServers] = useState(false);
  const [editRole, setEditRole] = useState<{
    user: string;
    role: UserRole;
    permissions: string[];
    serverSlugs: string[];
    allServers: boolean;
  } | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/users', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    fetch('/api/servers', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: ServerItem[]) => setServers(Array.isArray(data) ? data : []))
      .catch(() => setServers([]));
  }, []);

  const currentUser = currentAuthUser?.username;
  const isAdmin = currentAuthUser?.role === 'admin';
  const [setupDone, setSetupDone] = useState(true);
  useEffect(() => {
    fetch('/api/auth/setup-done', { credentials: 'include' }).then((r) => r.json()).then((d: { setupDone?: boolean }) => setSetupDone(!!d.setupDone));
  }, []);

  const handleGeneratePassword = () => {
    const pw = generatePassword();
    setNewPassword(pw);
    setGeneratedCopy(false);
  };

  const handleCopyCredentials = (username: string, password: string) => {
    const text = `Benutzername: ${username}\nPasswort: ${password}`;
    navigator.clipboard.writeText(text).then(() => setGeneratedCopy(true));
    setTimeout(() => setGeneratedCopy(false), 2000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newUsername.trim()) {
      setError('Benutzername eingeben.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Passwort generieren oder mindestens 6 Zeichen eingeben.');
      return;
    }
    if (users.some((u) => u.username === newUsername.trim())) {
      setError('Benutzername existiert bereits.');
      return;
    }
    const serverSlugs = newRole === 'admin' || newAllServers ? ['*'] : newServerSlugs;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim() || undefined,
        role: newRole,
        permissions: newRole === 'user' ? newPermissions : undefined,
        serverSlugs,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Fehler beim Anlegen.');
      return;
    }
    await refresh();
    setShowAdd(false);
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('user');
    setNewPermissions([]);
    setNewServerSlugs([]);
    setNewAllServers(false);
  };

  const handleRemoveUser = async (username: string) => {
    if (username === currentUser) return;
    if (!confirm(`Benutzer „${username}“ wirklich entfernen?`)) return;
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) await refresh();
  };

  const handleSaveRole = async (
    username: string,
    role: UserRole,
    permissions: string[],
    serverSlugs: string[],
    allServers: boolean
  ) => {
    const slugs = role === 'admin' || allServers ? ['*'] : serverSlugs;
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role, permissions: role === 'user' ? permissions : undefined, serverSlugs: slugs }),
    });
    if (res.ok) {
      await refresh();
      setEditRole(null);
    }
  };

  const togglePerm = (id: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(id)) setList(list.filter((p) => p !== id));
    else setList([...list, id]);
  };

  const toggleServerSlug = (slug: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(slug)) setList(list.filter((s) => s !== slug));
    else setList([...list, slug]);
  };

  const formatServerAccess = (u: ApiUser) => {
    if (u.role === 'admin') return 'Alle Server';
    const slugs = u.serverSlugs ?? [];
    if (slugs?.includes('*')) return 'Alle Server';
    if (!slugs?.length) return 'Keine';
    return servers.filter((s) => slugs.includes(s.slug)).map((s) => s.name).join(', ') || slugs.join(', ');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <UsersIcon className="h-7 w-7 text-panel-muted" />
              Benutzer
            </h1>
            <p className="mt-1 text-sm text-panel-muted">
              Konten anlegen (Passwort wird generiert), Rechte und Server-Zugriff vergeben. Nach dem Anlegen die Zugangsdaten an die Person senden – damit kann sie sich im Panel anmelden.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowAdd(true);
                setError('');
                setNewPassword(generatePassword());
              }}
              className="flex items-center gap-2 rounded-lg border border-panel-accent bg-panel-accent/20 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-panel-accent/30"
            >
              <Plus className="h-4 w-4" />
              Benutzer hinzufügen
            </button>
          )}
        </div>
      </header>

      <div className="p-8">
        {!currentUser && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="font-medium text-amber-200">Nicht angemeldet</p>
            <p className="mt-1 text-sm text-panel-muted">
              Um Benutzer anzulegen und zu verwalten, musst du dich als Admin anmelden.
              {setupDone ? (
                <>
                  {' '}
                  <Link href="/login" className="inline-flex items-center gap-1 text-amber-400 hover:underline">
                    <LogIn className="h-4 w-4" />
                    Jetzt anmelden
                  </Link>
                </>
              ) : (
                <>
                  {' '}
                  <Link href="/setup" className="inline-flex items-center gap-1 text-amber-400 hover:underline">
                    <Settings className="h-4 w-4" />
                    Zuerst Einrichtung (Admin anlegen)
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
        {currentUser && !isAdmin && (
          <div className="mb-6 rounded-xl border border-panel-border bg-panel-card p-4">
            <p className="text-sm text-panel-muted">Nur Admins können Benutzer anlegen und bearbeiten. Dein Konto hat keine Admin-Rechte.</p>
          </div>
        )}
        {showAdd && (
          <div className="mb-6 rounded-xl border border-panel-border bg-panel-card p-6">
            <h2 className="mb-4 text-lg font-medium text-white">Neues Konto anlegen</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm text-panel-muted">Name (Anzeigename)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full max-w-xs rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
                  placeholder="z. B. Max Mustermann"
                />
              </div>
              <div>
                <label className="block text-sm text-panel-muted">Benutzername (zum Anmelden)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full max-w-xs rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
                  placeholder="z. B. mmustermann"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-panel-muted">Passwort (wird generiert – an Person senden)</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="flex items-center gap-1 rounded border border-panel-border px-2 py-1 text-xs text-panel-muted hover:bg-panel-border/50 hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Neu generieren
                  </button>
                </div>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 max-w-xs rounded-lg border border-panel-border bg-panel-bg px-3 py-2 font-mono text-sm text-white"
                    placeholder="Klick auf Neu generieren"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(newUsername.trim() || '…', newPassword)}
                    className="flex items-center gap-1 rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-sm text-panel-muted hover:bg-panel-border/50 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                    {generatedCopy ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-panel-muted">Rolle</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="mt-1 w-full max-w-xs rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
                >
                  <option value="admin">Admin (kann alles, alle Server)</option>
                  <option value="user">Benutzer (Rechte + Server wählbar)</option>
                </select>
              </div>
              {newRole === 'user' && (
                <>
                  <div>
                    <label className="block text-sm text-panel-muted">Rechte</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PERMISSION_OPTIONS.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded border border-panel-border px-3 py-1.5 text-sm text-white hover:bg-panel-border/30">
                          <input
                            type="checkbox"
                            checked={newPermissions.includes(p.id)}
                            onChange={() => togglePerm(p.id, newPermissions, setNewPermissions)}
                            className="rounded border-panel-border"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-panel-muted">Zugriff auf Server</label>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={newAllServers}
                        onChange={(e) => {
                          setNewAllServers(e.target.checked);
                          if (e.target.checked) setNewServerSlugs([]);
                        }}
                        className="rounded border-panel-border"
                      />
                      Alle Server
                    </label>
                    {!newAllServers && servers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {servers.map((s) => (
                          <label key={s.slug} className="flex cursor-pointer items-center gap-2 rounded border border-panel-border px-3 py-1.5 text-sm text-white hover:bg-panel-border/30">
                            <input
                              type="checkbox"
                              checked={newServerSlugs.includes(s.slug)}
                              onChange={() => toggleServerSlug(s.slug, newServerSlugs, setNewServerSlugs)}
                              className="rounded border-panel-border"
                            />
                            <Server className="h-3.5 w-3.5" />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    )}
                    {!newAllServers && servers.length === 0 && (
                      <p className="mt-1 text-xs text-panel-muted">Keine Server vorhanden. Erst Server anlegen, dann Zugriff zuweisen.</p>
                    )}
                  </div>
                </>
              )}
              {error && <p className="text-sm text-panel-red">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-panel-accent px-4 py-2 text-sm text-white hover:bg-panel-accent-hover">
                  Konto anlegen
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-panel-border px-4 py-2 text-sm text-panel-muted hover:bg-panel-border/30">
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-panel-border bg-panel-card">
          <div className="border-b border-panel-border px-4 py-3">
            <h2 className="text-sm font-medium text-white">Alle Benutzer ({users.length})</h2>
          </div>
          {users.length === 0 ? (
            <div className="p-8 text-center text-sm text-panel-muted">Keine Benutzer außer dem Admin.</div>
          ) : (
            <ul className="divide-y divide-panel-border">
              {users.map((u) => (
                <li key={u.username} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-panel-bg">
                      {u.role === 'admin' ? <Shield className="h-5 w-5 text-amber-400" /> : <User className="h-5 w-5 text-panel-muted" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{u.name || u.username}</p>
                      <p className="text-xs text-panel-muted">
                        {u.username}
                        {u.role === 'user' && ` · ${(u.permissions || []).length} Rechte`}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-panel-muted">
                        <Server className="h-3 w-3" />
                        {formatServerAccess(u)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editRole?.user === u.username ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={editRole.role}
                          onChange={(e) => setEditRole((prev) => prev ? { ...prev, role: e.target.value as UserRole } : null)}
                          className="rounded border border-panel-border bg-panel-bg px-2 py-1 text-sm text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">Benutzer</option>
                        </select>
                        {editRole.role === 'user' && (
                          <>
                            <div className="flex flex-wrap gap-1">
                              {PERMISSION_OPTIONS.map((p) => (
                                <label key={p.id} className="flex items-center gap-1 rounded border border-panel-border px-2 py-0.5 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={editRole.permissions.includes(p.id)}
                                    onChange={() =>
                                      setEditRole((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              permissions: prev.permissions.includes(p.id)
                                                ? prev.permissions.filter((x) => x !== p.id)
                                                : [...prev.permissions, p.id],
                                            }
                                          : null
                                      )
                                    }
                                  />
                                  {p.label}
                                </label>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 border-l border-panel-border pl-2">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={editRole.allServers}
                                  onChange={(e) => setEditRole((prev) => (prev ? { ...prev, allServers: e.target.checked } : null))}
                                />
                                Alle Server
                              </label>
                              {!editRole.allServers &&
                                servers.map((s) => (
                                  <label key={s.slug} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editRole.serverSlugs.includes(s.slug)}
                                      onChange={() =>
                                        setEditRole((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                serverSlugs: prev.serverSlugs.includes(s.slug)
                                                  ? prev.serverSlugs.filter((x) => x !== s.slug)
                                                  : [...prev.serverSlugs, s.slug],
                                              }
                                            : null
                                        )
                                      }
                                    />
                                    {s.name}
                                  </label>
                                ))}
                            </div>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveRole(u.username, editRole.role, editRole.permissions, editRole.serverSlugs, editRole.allServers)
                          }
                          className="rounded bg-panel-accent px-2 py-1 text-xs text-white"
                        >
                          Speichern
                        </button>
                        <button type="button" onClick={() => setEditRole(null)} className="rounded border border-panel-border px-2 py-1 text-xs text-panel-muted">
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <>
                        {isAdmin && u.username !== currentUser && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditRole({
                                user: u.username,
                                role: u.role,
                                permissions: u.permissions || [],
                                serverSlugs: u.serverSlugs?.includes('*') ? [] : u.serverSlugs || [],
                                allServers: u.serverSlugs?.includes('*') ?? false,
                              })
                            }
                            className="rounded px-2 py-1 text-xs text-panel-muted hover:bg-panel-border hover:text-white"
                          >
                            Rechte & Server bearbeiten
                          </button>
                        )}
                        {isAdmin && u.username !== currentUser && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u.username)}
                            className="rounded p-2 text-panel-muted hover:bg-panel-red/20 hover:text-panel-red"
                            title="Benutzer entfernen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
