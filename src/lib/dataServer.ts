/**
 * Server-seitige Persistenz (nur in API Routes verwenden).
 * Speichert Server und Benutzer in JSON-Dateien unter ./data
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ServerItem } from './servers';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readServers(): Promise<ServerItem[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SERVERS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeServers(servers: ServerItem[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SERVERS_FILE, JSON.stringify(servers, null, 2), 'utf-8');
}

export interface StoredUser {
  username: string;
  passwordHash: string;
  name?: string;
  role: 'admin' | 'user';
  permissions?: string[];
  serverSlugs?: string[];
}

export interface UsersData {
  admin: { username: string; passwordHash: string } | null;
  users: StoredUser[];
}

export async function readUsers(): Promise<UsersData> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as UsersData;
  } catch {
    return { admin: null, users: [] };
  }
}

export async function writeUsers(data: UsersData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Settings (Proxy, Routing, Defaults) ---
export interface ListenerItem {
  id: string;
  name: string;
  port: string;
  default?: boolean;
  serverCount?: number;
}

export interface PanelSettings {
  baseDomain: string;
  proxyEnabled: boolean;
  listeners: ListenerItem[];
  activeRoutes: Record<string, string>; // serverSlug -> hostname
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export async function readSettings(): Promise<PanelSettings> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return {
      baseDomain: data.baseDomain ?? 'play.laxpanel.app',
      proxyEnabled: Boolean(data.proxyEnabled),
      listeners: Array.isArray(data.listeners) ? data.listeners : [],
      activeRoutes: data.activeRoutes && typeof data.activeRoutes === 'object' ? data.activeRoutes : {},
    };
  } catch {
    return {
      baseDomain: 'play.laxpanel.app',
      proxyEnabled: false,
      listeners: [],
      activeRoutes: {},
    };
  }
}

export async function writeSettings(settings: PanelSettings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// --- Activity Log (Dashboard Recent Activity) ---
export interface ActivityEntry {
  id: string;
  text: string;
  slug?: string;
  type: 'start' | 'stop' | 'restart' | 'create' | 'delete';
  at: string; // ISO
}

const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const MAX_ACTIVITY = 100;

export async function readActivity(): Promise<ActivityEntry[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(ACTIVITY_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function appendActivity(entry: Omit<ActivityEntry, 'id' | 'at'>): Promise<void> {
  await ensureDataDir();
  const list = await readActivity();
  const newEntry: ActivityEntry = {
    ...entry,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
  };
  list.unshift(newEntry);
  const trimmed = list.slice(0, MAX_ACTIVITY);
  await fs.writeFile(ACTIVITY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}
