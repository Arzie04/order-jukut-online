import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '@/app/lib/api-config';
import { devError, devLog } from '@/app/lib/logger';
import { mapOrderStatusMessage } from '@/app/lib/order-status';

interface SheetOrderRow {
  no_order?: string;
  nama?: string;
  pesanan?: string;
  status?: string;
}

export async function GET(request: NextRequest) {
  try {
    const orderCodeRaw = request.nextUrl.searchParams.get('orderCode') || '';
    const orderCode = orderCodeRaw.trim().toUpperCase();

    devLog('[ORDER_STATUS] Lookup:', orderCode);

    if (!/^ORD-\d+$/.test(orderCode)) {
      return NextResponse.json(
        { success: false, error: 'Format nomor order tidak valid. Gunakan format ORD-XXXX.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?api=orders`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

    if (!response.ok) {
      devError('[ORDER_STATUS] GAS HTTP error:', response.status);
      return NextResponse.json(
        { success: false, error: `Gagal mengakses data order (HTTP ${response.status}).` },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as SheetOrderRow[];
    const matchedOrder = Array.isArray(payload)
      ? payload.find((row) => String(row?.no_order || '').trim().toUpperCase() === orderCode)
      : null;

    if (!matchedOrder) {
      devLog('[ORDER_STATUS] Not found:', orderCode);
      return NextResponse.json(
        { success: false, error: 'Nomor order tidak ditemukan.' },
        { status: 404 }
      );
    }

    const rawStatus = String(matchedOrder.status || '').trim();
    const friendlyMessage = mapOrderStatusMessage(rawStatus);

    devLog('[ORDER_STATUS] Mapped status:', { orderCode, rawStatus, friendlyMessage });

    return NextResponse.json({
      success: true,
      orderCode,
      customerName: String(matchedOrder.nama || '-').trim() || '-',
      items: String(matchedOrder.pesanan || '-').trim() || '-',
      message: friendlyMessage,
    });
  } catch (error) {
    devError('[ORDER_STATUS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown order status error',
      },
      { status: 500 }
    );
  }
}
