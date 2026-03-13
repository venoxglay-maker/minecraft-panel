import { NextRequest, NextResponse } from 'next/server';

const MODRINTH_API = 'https://api.modrinth.com/v2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const facets = searchParams.get('facets') ?? '[[\"project_type:modpack\"]]';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Number(searchParams.get('offset')) || 0;
  const index = searchParams.get('index') ?? 'downloads';

  const url = new URL(`${MODRINTH_API}/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('facets', facets);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('index', index);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LaxPanel/minecraft-panel/0.0.1 (https://github.com/laxpanel)',
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Modrinth API error', detail: text },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch Modrinth', detail: String(e) },
      { status: 500 }
    );
  }
}
