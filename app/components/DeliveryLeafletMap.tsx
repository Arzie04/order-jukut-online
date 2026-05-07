'use client';

import { useEffect, useMemo } from 'react';
import { divIcon, type LeafletMouseEvent } from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { DELIVERY_ORIGIN } from '@/app/lib/delivery';

interface DeliveryLeafletMapProps {
  selectedPosition: [number, number] | null;
  onSelectPosition: (position: [number, number]) => void;
  onMapError: (message: string | null) => void;
  focusPosition?: [number, number] | null;
}

function ClickHandler({
  onSelectPosition,
}: {
  onSelectPosition: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelectPosition([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function FlyToLocation({ focusPosition }: { focusPosition?: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPosition) {
      return;
    }

    map.flyTo(focusPosition, Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 1.2,
    });
  }, [focusPosition, map]);

  return null;
}

export default function DeliveryLeafletMap({
  selectedPosition,
  onSelectPosition,
  onMapError,
  focusPosition,
}: DeliveryLeafletMapProps) {
  useEffect(() => {
    onMapError(null);
  }, [onMapError]);

  const outletIcon = useMemo(
    () =>
      divIcon({
        className: '',
        html: '<div style="font-size:28px; transform: translate(-2px, -6px);">📍</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
    []
  );

  const selectedIcon = useMemo(
    () =>
      divIcon({
        className: '',
        html: '<div style="font-size:30px; transform: translate(-2px, -6px);">📌</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    []
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={
          selectedPosition ?? [DELIVERY_ORIGIN.latitude, DELIVERY_ORIGIN.longitude]
        }
        zoom={15}
        scrollWheelZoom
        className="h-[320px] w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => {
              onMapError('Tile peta tidak berhasil dimuat.');
            },
          }}
        />
        <ClickHandler onSelectPosition={onSelectPosition} />
        <FlyToLocation focusPosition={focusPosition} />

        <CircleMarker
          center={[DELIVERY_ORIGIN.latitude, DELIVERY_ORIGIN.longitude]}
          radius={8}
          pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.9 }}
        >
          <Popup>Titik acuan outlet</Popup>
        </CircleMarker>

        <Marker
          position={[DELIVERY_ORIGIN.latitude, DELIVERY_ORIGIN.longitude]}
          icon={outletIcon}
        >
          <Popup>Titik acuan outlet</Popup>
        </Marker>

        {selectedPosition && (
          <Marker position={selectedPosition} icon={selectedIcon}>
            <Popup>Lokasi delivery terpilih</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
