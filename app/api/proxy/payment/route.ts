import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Payment proxy received:', body);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('Payment proxy response status:', response.status);
    
    const responseText = await response.text();
    console.log('Payment proxy response text:', responseText);

    if (!response.ok) {
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
    } catch (e) {
      console.warn('Failed to parse response as JSON, returning as text');
      data = { message: responseText, success: true };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment proxy error:', error);
    return NextResponse.json(
      { 
        error: `Failed to process payment confirmation: ${error instanceof Error ? error.message : String(error)}`,
        success: false 
      },
      { status: 500 }
    );
  }
}
