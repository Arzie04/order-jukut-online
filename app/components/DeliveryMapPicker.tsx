'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import { DELIVERY_ORIGIN, type DeliveryLocation, buildGoogleMapsLink } from '@/app/lib/delivery';

const DeliveryLeafletMap = dynamic(() => import('./DeliveryLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
      Memuat peta...
    </div>
  ),
});

interface DeliveryMapPickerProps {
  isOpen: boolean;
  initialLocation: DeliveryLocation | null;
  onClose: () => void;
  onConfirm: (location: DeliveryLocation) => void;
}

export default function DeliveryMapPicker({
  isOpen,
  initialLocation,
  onClose,
  onConfirm,
}: DeliveryMapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialLocation) {
      const nextPosition: [number, number] = [initialLocation.latitude, initialLocation.longitude];
      setSelectedPosition(nextPosition);
      setFocusPosition(nextPosition);
      return;
    }

    const outletPosition: [number, number] = [DELIVERY_ORIGIN.latitude, DELIVERY_ORIGIN.longitude];
    setSelectedPosition(outletPosition);
    setFocusPosition(outletPosition);
  }, [initialLocation, isOpen]);

  const previewLink = useMemo(() => {
    if (!selectedPosition) {
      return '';
    }

    return buildGoogleMapsLink(selectedPosition[0], selectedPosition[1]);
  }, [selectedPosition]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS/geolocation.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition: [number, number] = [position.coords.latitude, position.coords.longitude];
        setSelectedPosition(nextPosition);
        setFocusPosition(nextPosition);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setGpsError(error.message || 'Gagal mengambil lokasi GPS.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedPosition) {
      return;
    }

    const isConfirmed = window.confirm('Sudah yakin titik tepat?');
    if (!isConfirmed) {
      return;
    }

    onConfirm({
      latitude: selectedPosition[0],
      longitude: selectedPosition[1],
      mapsLink: buildGoogleMapsLink(selectedPosition[0], selectedPosition[1]),
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-white/50 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
          <h3 className="text-xl font-bold">Pilih Titik Lokasi Delivery</h3>
          <p className="text-sm text-white/90 mt-1">Klik titik di peta atau gunakan GPS perangkat.</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isLocating ? 'Mengambil GPS...' : 'Gunakan Lokasi Saya'}
            </button>
            <a
              href="https://maps.google.com/?q=-7.053727,110.396489"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Lihat Titik Acuan
            </a>
          </div>

          {gpsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              GPS gagal: {gpsError}
            </div>
          )}

          {mapError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Peta gagal dimuat: {mapError}
            </div>
          )}

          <DeliveryLeafletMap
            selectedPosition={selectedPosition}
            onSelectPosition={(position) => {
              setSelectedPosition(position);
              setFocusPosition(position);
            }}
            onMapError={setMapError}
            focusPosition={focusPosition}
          />

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 space-y-2">
            <div>
              Titik terpilih:{' '}
              {selectedPosition
                ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
                : 'Belum dipilih'}
            </div>
            {previewLink && (
              <a
                href={previewLink}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold break-all"
              >
                {previewLink}
              </a>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPosition}
            className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            Gunakan Titik Ini
          </button>
        </div>
      </div>
    </div>
  );
}
