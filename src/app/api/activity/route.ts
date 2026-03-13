import { NextResponse } from 'next/server';
import { getCurrentApiUser } from '@/lib/authApi';
import { readActivity } from '@/lib/dataServer';

export async function GET() {
  const me = await getCurrentApiUser();
  if (!me) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 });
  const activity = await readActivity();
  return NextResponse.json(activity);
}
