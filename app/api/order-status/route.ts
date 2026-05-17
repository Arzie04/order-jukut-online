import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '@/app/lib/api-config';

interface SheetOrderRow {
  no_order?: string;
  nama?: string;
  pesanan?: string;
  status?: string;
}

function mapStatusMessage(rawStatus: string) {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === 'terbaru') {
    return 'Pesanan sudah masuk dan segera disiapkan';
  }

  if (normalized === 'disiapkan' || normalized === 'disiapkan-printed') {
    return 'Pesanan sedang disiapkan';
  }

  if (normalized === 'siap') {
    return 'Pesanan sudah disiapkan dan bisa diambil';
  }

  if (normalized === 'selesai') {
    return 'Pesanan sudah selesai / diambil';
  }

  return `Status pesanan: ${rawStatus || '-'}`;
}

export async function GET(request: NextRequest) {
  try {
    const orderCodeRaw = request.nextUrl.searchParams.get('orderCode') || '';
    const orderCode = orderCodeRaw.trim().toUpperCase();

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
      return NextResponse.json(
        { success: false, error: 'Nomor order tidak ditemukan.' },
        { status: 404 }
      );
    }

    const status = String(matchedOrder.status || '').trim();
    return NextResponse.json({
      success: true,
      orderCode,
      customerName: String(matchedOrder.nama || '-').trim() || '-',
      items: String(matchedOrder.pesanan || '-').trim() || '-',
      message: mapStatusMessage(status),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown order status error',
      },
      { status: 500 }
    );
  }
}
