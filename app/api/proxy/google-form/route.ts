import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_FORM_FIELDS, GOOGLE_FORM_URL } from '../../../lib/api-config';
import { devError, devLog } from '../../../lib/logger';

interface SubmitGoogleFormBody {
  nama: string;
  pesanan: string;
  note: string;
  total: number;
  noOrder: string;
}

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

    if (!GOOGLE_FORM_URL) {
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

    const response = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
    });

    devLog('[GOOGLE_FORM] Submission status:', response.status);

    return NextResponse.json({
      success: true,
      status: response.status,
      configuredFields: {
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
