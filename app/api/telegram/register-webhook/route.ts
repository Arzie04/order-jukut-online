import { NextRequest, NextResponse } from 'next/server';

import { devError } from '@/app/lib/logger';
import { getTelegramWebhookInfo, setTelegramWebhook } from '@/app/lib/telegram';

function getWebhookUrl(request: NextRequest) {
  const url = new URL('/api/telegram/webhook', request.nextUrl.origin);
  return url.toString();
}

export async function GET(request: NextRequest) {
  try {
    const webhookUrl = getWebhookUrl(request);
    const setWebhookResult = await setTelegramWebhook(webhookUrl);
    const webhookInfo = await getTelegramWebhookInfo();

    return NextResponse.json({
      ok: true,
      message: 'Telegram webhook registered.',
      requestedAt: new Date().toISOString(),
      webhookUrl,
      setWebhookResult,
      webhookInfo: webhookInfo?.result || null,
    });
  } catch (error) {
    devError('[TELEGRAM_REGISTER_WEBHOOK] Error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown Telegram webhook registration error',
      },
      { status: 500 }
    );
  }
}
