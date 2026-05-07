import { NextRequest, NextResponse } from 'next/server';

import { calculateDistanceKm, DELIVERY_ORIGIN } from '@/app/lib/delivery';
import { devError } from '@/app/lib/logger';

interface DeliveryDistanceRequestBody {
  latitude: number;
  longitude: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeliveryDistanceRequestBody;

    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Latitude dan longitude wajib valid.',
        },
        { status: 400 }
      );
    }

    const fallbackDistanceKm = calculateDistanceKm(DELIVERY_ORIGIN, {
      latitude: body.latitude,
      longitude: body.longitude,
    });

    try {
      const osrmUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${DELIVERY_ORIGIN.longitude},${DELIVERY_ORIGIN.latitude};${body.longitude},${body.latitude}` +
        `?overview=false`;

      const response = await fetch(osrmUrl, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`OSRM HTTP ${response.status}`);
      }

      const data = await response.json();
      const distanceMeters = data?.routes?.[0]?.distance;

      if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters)) {
        throw new Error('OSRM tidak mengembalikan route distance yang valid.');
      }

      return NextResponse.json({
        success: true,
        source: 'road',
        distanceKm: distanceMeters / 1000,
      });
    } catch (routeError) {
      devError('[DELIVERY_DISTANCE] Route distance failed, using haversine fallback:', routeError);

      return NextResponse.json({
        success: true,
        source: 'haversine',
        distanceKm: fallbackDistanceKm,
      });
    }
  } catch (error) {
    devError('[DELIVERY_DISTANCE] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery distance error',
      },
      { status: 500 }
    );
  }
}
