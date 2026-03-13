import { NextResponse } from 'next/server';
import { readUsers } from '@/lib/dataServer';

export async function GET() {
  const data = await readUsers();
  return NextResponse.json({ setupDone: !!data.admin });
}
