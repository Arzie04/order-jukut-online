import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || 
  'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

interface InsertOrderBody {
  nama: string;
  pesanan: string;
  note: string;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body = (await request.json()) as InsertOrderBody;

    console.log('[INSERT_ORDER] Request received:', {
      nama: body.nama,
      pesanan: body.pesanan ? body.pesanan.substring(0, 50) : '',
      note: body.note,
      total: body.total
    });

    // Validate required fields
    if (!body.nama || !body.pesanan || body.total == null) {
      console.error('[INSERT_ORDER] Validation failed - missing required fields');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nama, pesanan, dan total harus diisi' 
        },
        { status: 400 }
      );
    }

    // Prepare payload for Apps Script
    const appsScriptPayload = {
      type: 'INSERT_ORDER',
      nama: body.nama.trim(),
      pesanan: body.pesanan.trim(),
      note: body.note.trim(),
      total: body.total,
      status: 'terbaru'
    };

    console.log('[INSERT_ORDER] Sending to Apps Script:', appsScriptPayload);

    // Call Apps Script with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appsScriptPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let responseData;
    const responseText = await response.text();

    console.log('[INSERT_ORDER] Apps Script response status:', response.status);
    console.log('[INSERT_ORDER] Apps Script response text:', responseText);

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('[INSERT_ORDER] Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server returned invalid response',
          raw_response: responseText 
        },
        { status: 502 }
      );
    }

    // Check if Apps Script returned an error
    if (!responseData.success) {
      console.error('[INSERT_ORDER] Apps Script error:', responseData.error);
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.error || 'Gagal membuat pesanan' 
        },
        { status: 400 }
      );
    }

    console.log('[INSERT_ORDER] Success - Order number:', responseData.no_order);

    // Return success response
    return NextResponse.json({
      success: true,
      message: responseData.message,
      no_order: responseData.no_order,
      timestamp: responseData.timestamp
    });

  } catch (error: any) {
    console.error('[INSERT_ORDER] Error:', error);

    // Distinguish between different error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timeout (45s) - server mungkin sedang sibuk' 
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: `Error: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
