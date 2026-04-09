import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const api = searchParams.get('api') || 'config';

  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?api=${api}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data);
    
    // Aggressive caching untuk config, less aggressive untuk orders
    if (api === 'config') {
      nextResponse.headers.set('Cache-Control', 'max-age=300, s-maxage=300, stale-while-revalidate=600');
    } else if (api === 'orders') {
      nextResponse.headers.set('Cache-Control', 'max-age=60, s-maxage=60, stale-while-revalidate=120');
    }
    nextResponse.headers.set('CDN-Cache-Control', `max-age=${api === 'config' ? 300 : 60}`);
    return nextResponse;
  } catch (error) {
    console.error('Config/Orders proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config/orders data' },
      { status: 500 }
    );
  }
}
