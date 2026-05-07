import { NextResponse } from 'next/server';

import { createSupabaseServerClientSafe } from '@/app/lib/supabase-server';
import { devError, devWarn } from '@/app/lib/logger';

export async function GET() {
  try {
    const supabase = createSupabaseServerClientSafe();
    
    // If Supabase is not configured, return disabled delivery status
    if (!supabase) {
      devWarn('[DELIVERY_STATUS] Supabase not configured - delivery disabled');
      return NextResponse.json({
        deliveryEnabled: false,
        standbyDrivers: 0,
        message: 'Delivery service not configured',
      });
    }

    const { count, error } = await supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'standby')
      .eq('is_verified', true);

    if (error) {
      throw error;
    }

    const standbyDrivers = count || 0;

    return NextResponse.json({
      deliveryEnabled: standbyDrivers > 0,
      standbyDrivers,
    });
  } catch (error) {
    devError('[DELIVERY_STATUS] Error:', error);

    return NextResponse.json(
      {
        deliveryEnabled: false,
        standbyDrivers: 0,
        error: error instanceof Error ? error.message : 'Unknown delivery status error',
      },
      { status: 500 }
    );
  }
}
