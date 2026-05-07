import { devError } from '@/app/lib/logger';

function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    devError('[TELEGRAM] Missing required env: TELEGRAM_BOT_TOKEN');
    throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
  }

  return token;
}

function getTelegramApiUrl(method: string) {
  return `https://api.telegram.org/bot${getTelegramBotToken()}/${method}`;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>
) {
  const response = await fetch(getTelegramApiUrl('sendMessage'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${responseText}`);
  }

  return response.json();
}

export async function getTelegramWebhookInfo() {
  const response = await fetch(getTelegramApiUrl('getWebhookInfo'));

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Telegram getWebhookInfo failed: ${response.status} ${responseText}`);
  }

  return response.json();
}

export async function setTelegramWebhook(webhookUrl: string) {
  const response = await fetch(getTelegramApiUrl('setWebhook'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Telegram setWebhook failed: ${response.status} ${responseText}`);
  }

  return response.json();
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text: string,
  showAlert = false
) {
  const response = await fetch(getTelegramApiUrl('answerCallbackQuery'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Telegram answerCallbackQuery failed: ${response.status} ${responseText}`);
  }
}

export async function editTelegramMessageReplyMarkup(
  chatId: string,
  messageId: number,
  replyMarkup?: Record<string, unknown>
) {
  const response = await fetch(getTelegramApiUrl('editMessageReplyMarkup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    devError('Telegram editMessageReplyMarkup failed:', response.status, responseText);
  }
}
