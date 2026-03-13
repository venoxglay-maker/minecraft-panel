import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // In production: read file from server data path for this slug
  return NextResponse.json({ slug, path: 'server.properties', content: '' });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { path, content } = body as { path?: string; content?: string };
  if (!path || content === undefined) {
    return NextResponse.json(
      { error: 'path and content required' },
      { status: 400 }
    );
  }
  // In production: write content to server directory for this slug
  return NextResponse.json({ ok: true, slug, path });
}
