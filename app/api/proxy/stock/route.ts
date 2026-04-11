import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '../../../lib/api-config';
import { devError, devLog, devWarn } from '../../../lib/logger';

interface StockUpdatePayload {
  nama_item: string;
  quantity: number;
}

interface StockUpdateRequestBody {
  updates?: Array<{
    nama_item?: string;
    quantity?: number | string;
  }>;
}

export async function GET() {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StockUpdateRequestBody;
    const rawUpdates = Array.isArray(body?.updates) ? body.updates : [];

    const updates: StockUpdatePayload[] = rawUpdates
      .map((item) => ({
        nama_item: typeof item?.nama_item === 'string' ? item.nama_item.trim() : '',
        quantity: Number(item?.quantity) || 0,
      }))
      .filter((item: StockUpdatePayload) => item.nama_item && item.quantity > 0);

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Update stok tidak valid atau kosong' },
        { status: 400 }
      );
    }

    const payload = {
      type: 'UPDATE_STOCK',
      updates,
    };

    devLog('[STOCK] Forwarding stock updates:', payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    devLog('[STOCK] Apps Script response status:', response.status);
    devLog('[STOCK] Apps Script response text:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `API Error: ${response.status}`,
          raw_response: responseText,
        },
        { status: response.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      devWarn('[STOCK] Response bukan JSON, fallback ke text response');
      return NextResponse.json({
        success: true,
        message: responseText || 'Update stok berhasil dikirim',
      });
    }
  } catch (error: unknown) {
    devError('Stock update proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update stock data';

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout saat update stok' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
