import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '../../../lib/api-config';
import { devError } from '../../../lib/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const api = searchParams.get('api') || 'config';
  const isNextOrderRequest = api === 'getNextOrderId';

  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?api=${api}`, {
      method: 'GET',
      cache: isNextOrderRequest ? 'no-store' : 'default',
      headers: {
        'Cache-Control': isNextOrderRequest
          ? 'no-store, no-cache, must-revalidate'
          : 'max-age=0, s-maxage=60, stale-while-revalidate=300'
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
    
    // Set short, stale-while-revalidate caching
    if (isNextOrderRequest) {
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      nextResponse.headers.set('CDN-Cache-Control', 'no-store');
      nextResponse.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    } else if (api === 'config') {
      // Config changes less often, cache for 25s
      nextResponse.headers.set('Cache-Control', 'max-age=25, s-maxage=25, stale-while-revalidate=60');
      nextResponse.headers.set('CDN-Cache-Control', 'public, max-age=25');
      nextResponse.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=25');
    } else { // 'orders'
      // Orders change frequently, cache for 15s
      nextResponse.headers.set('Cache-Control', 'max-age=15, s-maxage=15, stale-while-revalidate=60');
      nextResponse.headers.set('CDN-Cache-Control', 'public, max-age=15');
      nextResponse.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=15');
    }
    return nextResponse;
  } catch (error) {
    devError('Config/Orders proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config/orders data' },
      { status: 500 }
    );
  }
}
