'use client';

import { useState } from 'react';

interface TrackingResult {
  orderCode: string;
  customerName: string;
  items: string;
  message: string;
}

export default function OrderStatusTracker() {
  const [orderSuffix, setOrderSuffix] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const digits = orderSuffix.trim();
    if (!/^\d+$/.test(digits)) {
      setError('Masukkan angka nomor order yang valid.');
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/order-status?orderCode=ORD-${digits}`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setError(payload.error || 'Gagal cek status order.');
        return;
      }

      setResult({
        orderCode: payload.orderCode || `ORD-${digits}`,
        customerName: payload.customerName || '-',
        items: payload.items || '-',
        message: payload.message || '-',
      });
    } catch {
      setError('Tidak bisa terhubung ke server. Coba lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/40 p-4 shadow-md">
      <h3 className="text-base font-bold text-gray-800">Cek Status Pesanan</h3>
      <p className="mt-1 text-xs text-gray-600">Lacak progres pesananmu dengan memasukan nomor orderanmu!.</p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
          <span className="bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">ORD-</span>
          <input
            value={orderSuffix}
            onChange={(e) => setOrderSuffix(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="4821"
            className="w-full px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isChecking}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition ${
            isChecking ? 'bg-gray-400' : 'bg-emerald-600 shadow hover:bg-emerald-700'
          }`}
        >
          {isChecking ? 'Mengecek...' : 'Cek Status'}
        </button>
      </form>

      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
          <div className="bg-emerald-600 px-3 py-2 text-center text-sm font-bold tracking-wide text-white">
            {result.orderCode}
          </div>
          <div className="space-y-2 px-3 py-3 text-sm text-gray-700">
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Nama Pemesan</div>
              <div className="font-semibold text-gray-800">{result.customerName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase text-gray-500">Isi Pesanan</div>
              <div className="whitespace-pre-wrap text-gray-700">{result.items}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase text-emerald-700">Status Pesanan</div>
              <div className="mt-0.5 font-bold text-emerald-800">{result.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
