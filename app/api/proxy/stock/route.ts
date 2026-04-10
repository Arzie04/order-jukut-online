import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '../../../lib/api-config';
import { devError } from '../../../lib/logger';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?api=stock`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'max-age=0, s-maxage=45, stale-while-revalidate=120'
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
    // Set aggressive caching for CDN + browser
    nextResponse.headers.set('Cache-Control', 'max-age=45, s-maxage=45, stale-while-revalidate=120');
    nextResponse.headers.set('CDN-Cache-Control', 'max-age=45');
    return nextResponse;
  } catch (error) {
    devError('Stock proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
