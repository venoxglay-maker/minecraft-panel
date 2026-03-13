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
