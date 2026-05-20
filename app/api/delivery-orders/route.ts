import { NextRequest, NextResponse } from 'next/server';

import {
  type DeliveryOrderCreatePayload,
  type DeliveryOrderRow,
  type DriverRow,
} from '@/app/lib/delivery-driver-system';
import { devError, devLog } from '@/app/lib/logger';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';

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
    const result = await supabase
      .from('delivery_orders')
      .insert(payload as Record<string, string | number>)
      .select('*')
      .single();
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

    if (!body.orderCode?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'orderCode wajib diisi untuk membuat delivery order.',
        },
        { status: 400 }
      );
    }

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

    const { data: existingOrders, error: existingOrderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('order_code', body.orderCode.trim())
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingOrderError) {
      throw existingOrderError;
    }

    const existingOrder = ((existingOrders || [])[0] || null) as DeliveryOrderRow | null;
    if (existingOrder) {
      devLog('[DELIVERY_ORDERS] Duplicate delivery request blocked', {
        orderCode: body.orderCode,
        deliveryOrderId: existingOrder.id,
      });

      return NextResponse.json({
        success: true,
        duplicate: true,
        deliveryOrderId: existingOrder.id,
        standbyDrivers: availableDrivers.length,
      });
    }

    const insertedOrder = await insertDeliveryOrderWithSchemaFallback(supabase, body);
    const orderRow = insertedOrder as DeliveryOrderRow;

    devLog('[DELIVERY_ORDERS] Order queued for driver bot project', {
      deliveryOrderId: orderRow.id,
      orderCode: orderRow.order_code,
      standbyDrivers: availableDrivers.length,
    });

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
