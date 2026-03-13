const KEY_ADMIN = 'laxpanel_admin';
const KEY_LOGGED_IN = 'laxpanel_logged_in';
const KEY_USERS = 'laxpanel_users';

export type UserRole = 'admin' | 'user';

export interface PanelUser {
  username: string;
  password: string;
  /** Anzeigename (z. B. "Max Mustermann") */
  name?: string;
  role: UserRole;
  permissions?: string[];
  /** Server-Slugs, auf die der Benutzer Zugriff hat. ["*"] = alle, leer = keine. */
  serverSlugs?: string[];
}

export interface AuthState {
  adminCreated: boolean;
  currentUser: string | null;
  users: PanelUser[];
}

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAdmin(): { username: string; password: string } | null {
  return getStorage(KEY_ADMIN, null);
}

export function isAdminCreated(): boolean {
  return getAdmin() !== null;
}

export function getLoggedIn(): string | null {
  return getStorage(KEY_LOGGED_IN, null);
}

export function getUsers(): PanelUser[] {
  return getStorage(KEY_USERS, []);
}

export function createAdmin(username: string, password: string): void {
  setStorage(KEY_ADMIN, { username, password: btoa(password) });
  setStorage(KEY_LOGGED_IN, username);
  setStorage(KEY_USERS, [{ username, password: btoa(password), role: 'admin' as UserRole, serverSlugs: ['*'] }]);
}

export function login(username: string, password: string): boolean {
  const admin = getAdmin();
  if (admin && admin.username === username && atob(admin.password) === password) {
    setStorage(KEY_LOGGED_IN, username);
    return true;
  }
  const users = getUsers();
  const user = users.find((u) => u.username === username && atob(u.password) === password);
  if (user) {
    setStorage(KEY_LOGGED_IN, username);
    return true;
  }
  return false;
}

export function logout(): void {
  setStorage(KEY_LOGGED_IN, null);
}

export function addUser(user: PanelUser): void {
  const users = getUsers();
  if (users.some((u) => u.username === user.username)) return;
  users.push({ ...user, password: btoa(user.password) });
  setStorage(KEY_USERS, users);
}

export function removeUser(username: string): void {
  const users = getUsers().filter((u) => u.username !== username);
  setStorage(KEY_USERS, users);
  if (getLoggedIn() === username) logout();
}

export function updateUserRole(username: string, role: UserRole, permissions?: string[], serverSlugs?: string[]): void {
  const users = getUsers();
  const i = users.findIndex((u) => u.username === username);
  if (i === -1) return;
  users[i] = { ...users[i], role, permissions, ...(serverSlugs !== undefined && { serverSlugs }) };
  setStorage(KEY_USERS, users);
}

/** Aktuell eingeloggter Benutzer (ohne Passwort), für Rechte/Server-Filter. */
export function getCurrentUser(): Omit<PanelUser, 'password'> | null {
  const username = getLoggedIn();
  if (!username) return null;
  const users = getUsers();
  const u = users.find((x) => x.username === username);
  if (!u) return null;
  const { password: _, ...rest } = u;
  return rest;
}

/** Prüft, ob der aktuelle Benutzer Zugriff auf einen Server (slug) hat. Kein Benutzer = Zugriff (z. B. lokaler Test). */
export function canAccessServer(slug: string): boolean {
  const user = getCurrentUser();
  if (!user) return true;
  if (user.role === 'admin') return true;
  const slugs = user.serverSlugs ?? [];
  return slugs.includes('*') || slugs.includes(slug);
}
