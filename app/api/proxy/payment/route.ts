import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '../../../lib/api-config';
import { devError, devLog, devWarn } from '../../../lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    devLog('💾 Payment proxy received:', body);
    devLog('   Type:', body.type);
    devLog('   No Order:', body.no_order);
    devLog('   Status Paid:', body.status_paid);

    // Validation
    if (!body.type || !body.no_order) {
      devError('❌ Missing required fields');
      return NextResponse.json(
        { 
          error: 'Missing required fields: type, no_order',
          success: false 
        },
        { status: 400 }
      );
    }

    // Add abort controller with timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for backend

    devLog('📤 Sending request to Google Apps Script...');
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    devLog('📡 Payment proxy response status:', response.status);
    devLog('📡 Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    devLog('📡 Response body (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      devError('❌ Non-OK response from Google Apps Script:', response.status);
      return NextResponse.json(
        { 
          error: `API Error: ${response.status} - ${responseText}`,
          success: false 
        },
        { status: response.status }
      );
    }

    // Try to parse as JSON, fallback to text if needed
    let data;
    try {
      data = JSON.parse(responseText);
      devLog('✅ Parsed response as JSON');
    } catch (e) {
      devWarn('⚠️  Failed to parse response as JSON, using text response');
      data = { message: responseText, success: true };
    }
    
    devLog('✅ Payment proxy success:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    devError('❌ Payment proxy error:', error);
    
    // Better error messaging
    let statusCode = 500;
    let errorMessage = `Failed to process payment confirmation`;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Payment confirmation request timeout. Google Apps Script took too long to respond.';
        statusCode = 504; // Gateway Timeout
        devError('⏱️  Timeout: Google Apps Script response took > 45 seconds');
      } else if (error.message.includes('fetch')) {
        errorMessage = `Network error connecting to Google Apps Script: ${error.message}`;
        statusCode = 502; // Bad Gateway
        devError('🌐 Network error:', error.message);
      } else {
        errorMessage = `Failed to process payment confirmation: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: statusCode }
    );
  }
}
