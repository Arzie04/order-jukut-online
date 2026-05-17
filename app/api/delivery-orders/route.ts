import { NextRequest, NextResponse } from 'next/server';

import {
  formatDeliveryOrderBroadcast,
  getTakeOrderKeyboard,
  type DeliveryOrderCreatePayload,
  type DeliveryOrderRow,
  type DriverRow,
} from '@/app/lib/delivery-driver-system';
import { devError } from '@/app/lib/logger';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';
import { sendTelegramMessage } from '@/app/lib/telegram';

async function insertDeliveryOrderWithSchemaFallback(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  body: DeliveryOrderCreatePayload
) {
  const commonPayload = {
    order_code: body.orderCode,
    items: body.items,
    total_price: body.totalPrice,
    delivery_fee: body.deliveryFee,
    distance_km: body.distanceKm,
    maps_link: body.mapsLink,
    note_driver: body.noteDriver,
    status: 'waiting_driver',
  };

  // Try legacy schema first (customer_*), then fallback to requested schema (costumer_*)
  const attempts = [
    {
      ...commonPayload,
      customer_name: body.customerName,
      customer_wa: body.customerWhatsapp,
    },
    {
      ...commonPayload,
      costumer_name: body.customerName,
      costumer_wa: body.customerWhatsapp,
    },
  ];

  let lastError: unknown = null;
  for (const payload of attempts) {
    const result = await supabase.from('delivery_orders').insert(payload).select('*').single();
    if (!result.error && result.data) {
      return result.data;
    }
    lastError = result.error;
  }

  throw lastError || new Error('Failed to insert delivery order.');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeliveryOrderCreatePayload;
    const supabase = createSupabaseServerClient();

    const { data: standbyDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'standby')
      .eq('is_verified', true);

    if (driversError) {
      throw driversError;
    }

    const availableDrivers = (standbyDrivers || []) as DriverRow[];

    if (availableDrivers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery sedang tidak tersedia karena tidak ada driver standby.',
        },
        { status: 409 }
      );
    }

    const insertedOrder = await insertDeliveryOrderWithSchemaFallback(supabase, body);

    const orderRow = insertedOrder as DeliveryOrderRow;
    const message = formatDeliveryOrderBroadcast(orderRow);

    await Promise.all(
      availableDrivers
        .filter((driver) => Boolean(driver.telegram_id))
        .map(async (driver) => {
          try {
            await sendTelegramMessage(
              String(driver.telegram_id),
              message,
              getTakeOrderKeyboard(orderRow.id)
            );
          } catch (telegramError) {
            devError(`[DELIVERY_ORDER] Failed to notify driver ${driver.id}:`, telegramError);
          }
        })
    );

    return NextResponse.json({
      success: true,
      deliveryOrderId: orderRow.id,
      standbyDrivers: availableDrivers.length,
    });
  } catch (error) {
    devError('[DELIVERY_ORDERS] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery order error',
      },
      { status: 500 }
    );
  }
}
