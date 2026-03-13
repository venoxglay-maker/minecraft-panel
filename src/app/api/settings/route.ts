import { NextRequest, NextResponse } from 'next/server';
import { getCurrentApiUser } from '@/lib/authApi';
import { readSettings, writeSettings, type PanelSettings } from '@/lib/dataServer';

export async function GET() {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  if (me.role !== 'admin') return NextResponse.json({ message: 'Nur Admins können Einstellungen ändern.' }, { status: 403 });
  try {
    const current = await readSettings();
    const body = await req.json().catch(() => ({}));
    const next: PanelSettings = {
      baseDomain: typeof body.baseDomain === 'string' ? body.baseDomain : current.baseDomain,
      proxyEnabled: typeof body.proxyEnabled === 'boolean' ? body.proxyEnabled : current.proxyEnabled,
      listeners: Array.isArray(body.listeners) ? body.listeners : current.listeners,
      activeRoutes: body.activeRoutes && typeof body.activeRoutes === 'object' ? body.activeRoutes : current.activeRoutes,
    };
    await writeSettings(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: 'Ungültige Anfrage.' }, { status: 400 });
  }
}
