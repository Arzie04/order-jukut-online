import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_FORM_FIELDS, GOOGLE_FORM_URL } from '../../../lib/api-config';
import { devError, devLog } from '../../../lib/logger';

interface SubmitGoogleFormBody {
  nama: string;
  pesanan: string;
  note: string;
  total: number;
  noOrder: string;
  mode?: 'pickup' | 'delivery';
  statusOrder?: string;
  mapsLink?: string;
  driverNote?: string;
  whatsappNumber?: string;
}

const DELIVERY_GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc3tkIBdkyeI2xxHeso4gaIJiFtJoxODzqdyUUXD9hnbpIq0A/formResponse';

const DELIVERY_GOOGLE_FORM_FIELDS = {
  NAMA: 'entry.1014222767',
  NO_ORDER: 'entry.1195577646',
  PESANAN_TOTAL: 'entry.337145487',
  STATUS_ORDER: 'entry.729729318',
  MAPS_LINK: 'entry.246791693',
  DRIVER_NOTE: 'entry.833983190',
} as const;

function getMissingConfig() {
  return {
    googleFormUrl: !GOOGLE_FORM_URL,
    nama: !GOOGLE_FORM_FIELDS.NAMA,
    pesanan: !GOOGLE_FORM_FIELDS.PESANAN,
    note: !GOOGLE_FORM_FIELDS.NOTE,
    total: !GOOGLE_FORM_FIELDS.TOTAL,
    noOrder: !GOOGLE_FORM_FIELDS.NO_ORDER,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitGoogleFormBody;
    const isDelivery = body.mode === 'delivery';

    if (!isDelivery && !GOOGLE_FORM_URL) {
      devError('[GOOGLE_FORM] Google Form URL is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Google Form URL belum dikonfigurasi di environment deployment',
          missingConfig: getMissingConfig(),
        },
        { status: 500 }
      );
    }

    if (!body.nama || !body.pesanan || !body.noOrder || body.total == null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data order belum lengkap untuk dikirim ke Google Form',
        },
        { status: 400 }
      );
    }

    const formData = new FormData();
    let submitUrl = GOOGLE_FORM_URL;

    if (isDelivery) {
      submitUrl = DELIVERY_GOOGLE_FORM_URL;
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.NAMA, body.nama);
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.NO_ORDER, body.noOrder);
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.PESANAN_TOTAL, body.pesanan);
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.STATUS_ORDER, body.statusOrder || 'Delivery');
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.MAPS_LINK, body.mapsLink || '');
      const deliveryNotes = [
        body.driverNote?.trim() || '',
        body.whatsappNumber?.trim() ? `WA: ${body.whatsappNumber.trim()}` : '',
      ].filter(Boolean).join('\n');
      formData.append(DELIVERY_GOOGLE_FORM_FIELDS.DRIVER_NOTE, deliveryNotes);
    } else {
      if (GOOGLE_FORM_FIELDS.NAMA) {
        formData.append(GOOGLE_FORM_FIELDS.NAMA, body.nama);
      }
      if (GOOGLE_FORM_FIELDS.PESANAN) {
        formData.append(GOOGLE_FORM_FIELDS.PESANAN, body.pesanan);
      }
      if (GOOGLE_FORM_FIELDS.NOTE) {
        formData.append(GOOGLE_FORM_FIELDS.NOTE, body.note ?? '');
      }
      if (GOOGLE_FORM_FIELDS.TOTAL) {
        formData.append(GOOGLE_FORM_FIELDS.TOTAL, String(body.total));
      }
      if (GOOGLE_FORM_FIELDS.NO_ORDER) {
        formData.append(GOOGLE_FORM_FIELDS.NO_ORDER, body.noOrder);
      }
    }

    const response = await fetch(submitUrl, {
      method: 'POST',
      body: formData,
    });

    devLog('[GOOGLE_FORM] Submission status:', response.status);

    return NextResponse.json({
      success: true,
      status: response.status,
      configuredFields: {
        mode: isDelivery ? 'delivery' : 'pickup',
        nama: Boolean(GOOGLE_FORM_FIELDS.NAMA),
        pesanan: Boolean(GOOGLE_FORM_FIELDS.PESANAN),
        note: Boolean(GOOGLE_FORM_FIELDS.NOTE),
        total: Boolean(GOOGLE_FORM_FIELDS.TOTAL),
        noOrder: Boolean(GOOGLE_FORM_FIELDS.NO_ORDER),
      },
    });
  } catch (error) {
    devError('[GOOGLE_FORM] Submission error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Google Form submission error',
      },
      { status: 500 }
    );
  }
}
