import { NextRequest, NextResponse } from 'next/server';

import { GOOGLE_APPS_SCRIPT_URL } from '../../../lib/api-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('💾 Payment proxy received:', body);
    console.log('   Type:', body.type);
    console.log('   No Order:', body.no_order);
    console.log('   Status Paid:', body.status_paid);

    // Validation
    if (!body.type || !body.no_order) {
      console.error('❌ Missing required fields');
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

    console.log('📤 Sending request to Google Apps Script...');
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log('📡 Payment proxy response status:', response.status);
    console.log('📡 Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('📡 Response body (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Non-OK response from Google Apps Script:', response.status);
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
      console.log('✅ Parsed response as JSON');
    } catch (e) {
      console.warn('⚠️  Failed to parse response as JSON, using text response');
      data = { message: responseText, success: true };
    }
    
    console.log('✅ Payment proxy success:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Payment proxy error:', error);
    
    // Better error messaging
    let statusCode = 500;
    let errorMessage = `Failed to process payment confirmation`;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Payment confirmation request timeout. Google Apps Script took too long to respond.';
        statusCode = 504; // Gateway Timeout
        console.error('⏱️  Timeout: Google Apps Script response took > 45 seconds');
      } else if (error.message.includes('fetch')) {
        errorMessage = `Network error connecting to Google Apps Script: ${error.message}`;
        statusCode = 502; // Bad Gateway
        console.error('🌐 Network error:', error.message);
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
