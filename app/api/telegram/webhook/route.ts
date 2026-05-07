import { NextRequest, NextResponse } from 'next/server';

import {
  formatDeliveryOrderBroadcast,
  getAssignedOrderKeyboard,
  getDeliveringOrderKeyboard,
  getDriverRegistrationSessions,
  getDriverStatusKeyboard,
  type DeliveryOrderRow,
  type DriverRow,
} from '@/app/lib/delivery-driver-system';
import { devError, devLog } from '@/app/lib/logger';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';
import {
  answerTelegramCallbackQuery,
  editTelegramMessageReplyMarkup,
  getTelegramWebhookInfo,
  sendTelegramMessage,
} from '@/app/lib/telegram';

function normalizeChatId(value: number | string | undefined) {
  return value == null ? '' : String(value);
}

function getCommandName(text: string) {
  const rawCommand = text.trim().split(/\s+/)[0] || '';
  return rawCommand.split('@')[0];
}

async function findVerifiedDriverByTelegramId(telegramId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('is_verified', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DriverRow | null;
}

async function updateDriverStatus(driverId: string, status: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('drivers')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', driverId);

  if (error) {
    throw error;
  }
}

async function handleRegistrationMessage(update: any) {
  const message = update.message;
  const chatId = normalizeChatId(message?.chat?.id);
  const text = String(message?.text || '').trim();
  const telegramUsername = message?.from?.username ? String(message.from.username) : null;
  const sessions = getDriverRegistrationSessions();

  if (!chatId || !text) {
    return;
  }

  const command = getCommandName(text);

  if (command === '/start') {
    await sendTelegramMessage(
      chatId,
      [
        '👋 Selamat datang di Driver Bot Ayam Jukut Cabe Ijo',
        '',
        'Command yang tersedia:',
        '',
        '/regist_driver → Registrasi driver',
        '/status → Melihat status driver',
        '/standby → Mengaktifkan standby',
        '/off → Menonaktifkan driver',
        '',
        'Gunakan command sesuai kebutuhan.',
      ].join('\n')
    );
    return;
  }

  if (command === '/regist_driver') {
    const existingDriver = await findVerifiedDriverByTelegramId(chatId);
    if (existingDriver) {
      await sendTelegramMessage(
        chatId,
        `Driver sudah terdaftar.\nNama: ${existingDriver.nama_driver}\nStatus: ${existingDriver.status || 'off'}`,
        getDriverStatusKeyboard()
      );
      return;
    }

    sessions.set(chatId, {
      step: 'await_name',
      telegramUsername: telegramUsername || undefined,
    });
    await sendTelegramMessage(chatId, 'Masukkan nama driver:');
    return;
  }

  if (command === '/standby' || command === '/off') {
    const driver = await findVerifiedDriverByTelegramId(chatId);
    if (!driver) {
      await sendTelegramMessage(chatId, 'Driver belum terdaftar. Gunakan /regist_driver terlebih dahulu.');
      return;
    }

    const nextStatus = command === '/standby' ? 'standby' : 'off';
    await updateDriverStatus(driver.id, nextStatus);
    await sendTelegramMessage(chatId, `Status driver diubah menjadi ${nextStatus.toUpperCase()}.`);
    return;
  }

  if (command === '/status' || command === '/status_driver') {
    const driver = await findVerifiedDriverByTelegramId(chatId);
    if (!driver) {
      await sendTelegramMessage(chatId, 'Driver belum terdaftar. Gunakan /regist_driver terlebih dahulu.');
      return;
    }

    await sendTelegramMessage(
      chatId,
      `Nama: ${driver.nama_driver}\nStatus: ${driver.status || 'off'}`,
      getDriverStatusKeyboard()
    );
    return;
  }

  const session = sessions.get(chatId);
  if (!session) {
    return;
  }

  if (session.step === 'await_name') {
    sessions.set(chatId, {
      ...session,
      step: 'await_code',
      namaDriver: text,
    });
    await sendTelegramMessage(chatId, 'Masukkan kode driver:');
    return;
  }

  if (session.step === 'await_code') {
    const supabase = createSupabaseServerClient();
    const { data: driverCode, error } = await supabase
      .from('driver_codes')
      .select('*')
      .eq('kode', text)
      .eq('is_used', false)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!driverCode) {
      await sendTelegramMessage(chatId, 'Kode driver tidak valid atau sudah dipakai. Coba lagi.');
      return;
    }

    sessions.set(chatId, {
      ...session,
      step: 'await_whatsapp',
      namaDriver: session.namaDriver,
      kodeDriver: text,
    });
    await sendTelegramMessage(chatId, 'Masukkan nomor WhatsApp driver:');
    return;
  }

  if (session.step === 'await_whatsapp') {
    sessions.set(chatId, {
      ...session,
      step: 'await_initial_status',
      nomorWa: text,
    });

    await sendTelegramMessage(
      chatId,
      [
        'Ringkasan registrasi driver:',
        `Nama: ${session.namaDriver || '-'}`,
        `Kode: ${session.kodeDriver || '-'}`,
        `No. WA: ${text}`,
        '',
        'Pilih status awal:',
      ].join('\n'),
      {
        inline_keyboard: [
          [
            { text: 'OFF', callback_data: 'register_status:off' },
            { text: 'STANDBY', callback_data: 'register_status:standby' },
          ],
        ],
      }
    );
  }
}

async function handleRegisterStatusCallback(callbackQuery: any, nextStatus: 'off' | 'standby') {
  const chatId = normalizeChatId(callbackQuery?.message?.chat?.id);
  const callbackQueryId = normalizeChatId(callbackQuery?.id);
  const telegramUsername = callbackQuery?.from?.username ? String(callbackQuery.from.username) : null;
  const sessions = getDriverRegistrationSessions();
  const session = sessions.get(chatId);

  if (!session?.namaDriver || !session.kodeDriver || !session.nomorWa) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Sesi registrasi sudah habis. Ulangi /regist_driver.', true);
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data: existingCode, error: codeError } = await supabase
    .from('driver_codes')
    .select('*')
    .eq('kode', session.kodeDriver)
    .eq('is_used', false)
    .maybeSingle();

  if (codeError) {
    throw codeError;
  }

  if (!existingCode) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Kode driver sudah dipakai atau tidak valid.', true);
    return;
  }

  const { data: insertedDriver, error: insertDriverError } = await supabase
    .from('drivers')
    .insert({
      telegram_id: chatId,
      telegram_username: telegramUsername,
      nama_driver: session.namaDriver,
      kode_driver: session.kodeDriver,
      nomor_wa: session.nomorWa,
      is_verified: true,
      status: nextStatus,
    })
    .select('*')
    .single();

  if (insertDriverError || !insertedDriver) {
    throw insertDriverError || new Error('Gagal menyimpan data driver.');
  }

  const { error: codeUpdateError } = await supabase
    .from('driver_codes')
    .update({
      is_used: true,
      used_by: insertedDriver.id,
    })
    .eq('id', existingCode.id)
    .eq('is_used', false);

  if (codeUpdateError) {
    throw codeUpdateError;
  }

  sessions.delete(chatId);
  await answerTelegramCallbackQuery(callbackQueryId, 'Registrasi driver berhasil.');
  await sendTelegramMessage(
    chatId,
    `Registrasi berhasil.\nNama: ${session.namaDriver}\nStatus awal: ${nextStatus.toUpperCase()}`,
    getDriverStatusKeyboard()
  );
}

async function handleDriverStatusCallback(callbackQuery: any, nextStatus: 'off' | 'standby') {
  const chatId = normalizeChatId(callbackQuery?.message?.chat?.id);
  const callbackQueryId = normalizeChatId(callbackQuery?.id);
  const driver = await findVerifiedDriverByTelegramId(chatId);

  if (!driver) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Driver belum terdaftar.', true);
    return;
  }

  if (driver.status === 'assigned' || driver.status === 'delivering') {
    await answerTelegramCallbackQuery(callbackQueryId, 'Status tidak bisa diubah saat sedang membawa order.', true);
    return;
  }

  await updateDriverStatus(driver.id, nextStatus);
  await answerTelegramCallbackQuery(callbackQueryId, `Status diubah menjadi ${nextStatus.toUpperCase()}.`);
  await sendTelegramMessage(chatId, `Status driver sekarang ${nextStatus.toUpperCase()}.`);
}

async function handleTakeOrderCallback(callbackQuery: any, orderId: string) {
  const chatId = normalizeChatId(callbackQuery?.message?.chat?.id);
  const callbackQueryId = normalizeChatId(callbackQuery?.id);
  const messageId = Number(callbackQuery?.message?.message_id);
  const driver = await findVerifiedDriverByTelegramId(chatId);

  if (!driver) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Driver belum terdaftar.', true);
    return;
  }

  if (driver.status !== 'standby') {
    await answerTelegramCallbackQuery(
      callbackQueryId,
      'Hanya driver standby yang bisa mengambil order baru.',
      true
    );
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data: updatedOrders, error: updateOrderError } = await supabase
    .from('delivery_orders')
    .update({
      assigned_driver: driver.id,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'waiting_driver')
    .is('assigned_driver', null)
    .select('*');

  if (updateOrderError) {
    throw updateOrderError;
  }

  const assignedOrder = (updatedOrders?.[0] || null) as DeliveryOrderRow | null;
  if (!assignedOrder) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Order sudah diambil driver lain.', true);
    return;
  }

  await updateDriverStatus(driver.id, 'assigned');
  await answerTelegramCallbackQuery(callbackQueryId, 'Order berhasil diambil.');
  await editTelegramMessageReplyMarkup(chatId, messageId, getAssignedOrderKeyboard(orderId));
  await sendTelegramMessage(
    chatId,
    `Anda mengambil order ${assignedOrder.order_code || '-'}.`,
    getAssignedOrderKeyboard(orderId)
  );
}

async function handleStartDeliveryCallback(callbackQuery: any, orderId: string) {
  const chatId = normalizeChatId(callbackQuery?.message?.chat?.id);
  const callbackQueryId = normalizeChatId(callbackQuery?.id);
  const messageId = Number(callbackQuery?.message?.message_id);
  const driver = await findVerifiedDriverByTelegramId(chatId);

  if (!driver) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Driver belum terdaftar.', true);
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data: updatedOrders, error } = await supabase
    .from('delivery_orders')
    .update({
      status: 'delivering',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('assigned_driver', driver.id)
    .eq('status', 'assigned')
    .select('*');

  if (error) {
    throw error;
  }

  const order = (updatedOrders?.[0] || null) as DeliveryOrderRow | null;
  if (!order) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Order ini tidak bisa dimulai.', true);
    return;
  }

  await updateDriverStatus(driver.id, 'delivering');
  await answerTelegramCallbackQuery(callbackQueryId, 'Status order diubah ke delivering.');
  await editTelegramMessageReplyMarkup(chatId, messageId, getDeliveringOrderKeyboard(orderId));
  await sendTelegramMessage(
    chatId,
    `Mulai antar order ${order.order_code || '-'}.`,
    getDeliveringOrderKeyboard(orderId)
  );
}

async function handleCompleteDeliveryCallback(callbackQuery: any, orderId: string) {
  const chatId = normalizeChatId(callbackQuery?.message?.chat?.id);
  const callbackQueryId = normalizeChatId(callbackQuery?.id);
  const driver = await findVerifiedDriverByTelegramId(chatId);

  if (!driver) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Driver belum terdaftar.', true);
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data: updatedOrders, error } = await supabase
    .from('delivery_orders')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('assigned_driver', driver.id)
    .eq('status', 'delivering')
    .select('*');

  if (error) {
    throw error;
  }

  const order = (updatedOrders?.[0] || null) as DeliveryOrderRow | null;
  if (!order) {
    await answerTelegramCallbackQuery(callbackQueryId, 'Order ini tidak bisa diselesaikan.', true);
    return;
  }

  await updateDriverStatus(driver.id, 'standby');
  await answerTelegramCallbackQuery(callbackQueryId, 'Order diselesaikan. Status driver kembali standby.');
  await sendTelegramMessage(chatId, `Order ${order.order_code || '-'} selesai diantar.`, getDriverStatusKeyboard());
}

async function handleCallbackQuery(update: any) {
  const callbackQuery = update.callback_query;
  const data = String(callbackQuery?.data || '');

  if (data.startsWith('register_status:')) {
    const nextStatus = data.split(':')[1] as 'off' | 'standby';
    await handleRegisterStatusCallback(callbackQuery, nextStatus);
    return;
  }

  if (data.startsWith('driver_status:')) {
    const nextStatus = data.split(':')[1] as 'off' | 'standby';
    await handleDriverStatusCallback(callbackQuery, nextStatus);
    return;
  }

  if (data.startsWith('delivery_take:')) {
    await handleTakeOrderCallback(callbackQuery, data.replace('delivery_take:', ''));
    return;
  }

  if (data.startsWith('delivery_start:')) {
    await handleStartDeliveryCallback(callbackQuery, data.replace('delivery_start:', ''));
    return;
  }

  if (data.startsWith('delivery_complete:')) {
    await handleCompleteDeliveryCallback(callbackQuery, data.replace('delivery_complete:', ''));
  }
}

export async function GET() {
  try {
    const webhookInfo = await getTelegramWebhookInfo();

    return NextResponse.json({
      ok: true,
      route: '/api/telegram/webhook',
      accepts: ['POST'],
      telegramWebhook: webhookInfo?.result || null,
    });
  } catch (error) {
    devError('[TELEGRAM_WEBHOOK][GET] Error:', error);

    return NextResponse.json(
      {
        ok: false,
        route: '/api/telegram/webhook',
        error: error instanceof Error ? error.message : 'Unknown Telegram webhook health error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    devLog('[TELEGRAM_WEBHOOK] Update received:', {
      hasMessage: Boolean(update?.message),
      hasCallbackQuery: Boolean(update?.callback_query),
      messageText: update?.message?.text || null,
      callbackData: update?.callback_query?.data || null,
    });

    if (update?.message?.text) {
      await handleRegistrationMessage(update);
    }

    if (update?.callback_query) {
      await handleCallbackQuery(update);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    devError('[TELEGRAM_WEBHOOK] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown Telegram webhook error',
      },
      { status: 500 }
    );
  }
}
