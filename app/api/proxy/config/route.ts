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
    
    // Aggressive caching untuk config, less aggressive untuk orders
    if (isNextOrderRequest) {
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      nextResponse.headers.set('CDN-Cache-Control', 'no-store');
      nextResponse.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    } else if (api === 'config') {
      nextResponse.headers.set('Cache-Control', 'max-age=300, s-maxage=300, stale-while-revalidate=600');
    } else if (api === 'orders') {
      nextResponse.headers.set('Cache-Control', 'max-age=60, s-maxage=60, stale-while-revalidate=120');
    }
    if (!isNextOrderRequest) {
      nextResponse.headers.set('CDN-Cache-Control', `max-age=${api === 'config' ? 300 : 60}`);
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
