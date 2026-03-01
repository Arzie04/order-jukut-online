'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClosedPage() {
  const router = useRouter();
  const [maxOrders, setMaxOrders] = useState<number>(15);

  // fungsi sama seperti di OrderingPage
  // hanya hitung baris yang kolom "no_order"-nya terisi
  const fetchOrderCount = async () => {
    try {
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbwhQv8nQxzbxESJddGaAZQNpVFF20HepUwe8lzddBqtydqvcQyIB0_KdcWFpOaIbLIZ/exec'
      );
      const data = await res.json();
      console.log('[CLOSED-API] raw data:', data);

      let count = 0;

      if (typeof data.count === 'number') {
        count = data.count;
      } else if (typeof data.validCount === 'number') {
        count = data.validCount;
      } else if (Array.isArray(data) && data.length > 0) {
        const first = data[0];

        if (!Array.isArray(first) && typeof first === 'object' && first !== null) {
          const key =
            Object.keys(first).find(
              (k) => k.toLowerCase().replace(/\s+/g, '_') === 'no_order'
            ) || 'no_order';

          count = data.filter((row: any) => {
            const val = row[key];
            return val !== null && val !== undefined && String(val).trim() !== '';
          }).length;
        } else if (Array.isArray(first)) {
          const header = first as any[];
          const idx = header.findIndex(
            (h) => typeof h === 'string' && h.toLowerCase().replace(/\s+/g, '_') === 'no_order'
          );

          if (idx !== -1) {
            for (let i = 1; i < data.length; i += 1) {
              const row = data[i];
              if (Array.isArray(row)) {
                const val = row[idx];
                if (val !== null && val !== undefined && String(val).trim() !== '') {
                  count += 1;
                }
              }
            }
          } else {
            count = data.length > 1 ? data.length - 1 : 0;
          }
        }
      }

      console.log('[CLOSED-API] valid order count:', count);
      return count;
    } catch (e) {
      console.error('unable to fetch order count (closed page)', e);
      return 0;
    }
  };

  // polling tiap 15 detik: buka lagi kalau jumlah pesanan < maxOrders
  useEffect(() => {
    let intervalId: number | undefined;

    const checkStatus = async () => {
      const m = localStorage.getItem('maxOrders');
      let parsedMax = m ? parseInt(m, 10) : maxOrders;

      if (Number.isNaN(parsedMax) || parsedMax <= 0) {
        parsedMax = 15;
        localStorage.setItem('maxOrders', '15');
      }

      setMaxOrders(parsedMax);

      const count = await fetchOrderCount();
      console.log('order count (closed page):', count, 'max:', parsedMax);
      if (count < parsedMax) {
        router.push('/');
      }
    };

    checkStatus();
    intervalId = window.setInterval(checkStatus, 15000);

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [maxOrders, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Outlet Tutup</h1>
        <p className="text-gray-700">
          Maaf Outlet sudah tutup atau pesanan online sudah melewati batas. Sistem akan
          otomatis membuka kembali jika kuota pesanan hari ini berkurang.
        </p>
      </div>
    </div>
  );
}
