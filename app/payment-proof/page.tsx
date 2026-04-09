'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

export const dynamic = 'force-dynamic';

function PaymentProofContent() {
  const searchParams = useSearchParams();
  const cloudinaryUrl = searchParams.get('url');
  const orderNumber = searchParams.get('order');

  useEffect(() => {
    if (cloudinaryUrl) {
      // Update meta tags untuk Open Graph
      const metaTags = [
        { property: 'og:title', content: `Bukti Pembayaran - ${orderNumber || 'Order'}` },
        { property: 'og:description', content: 'Bukti pembayaran pesanan Anda telah dikonfirmasi.' },
        { property: 'og:image', content: cloudinaryUrl },
        { property: 'og:type', content: 'image' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: cloudinaryUrl },
      ];

      metaTags.forEach((tag) => {
        let element = document.querySelector(`meta[property="${tag.property}"], meta[name="${tag.name}"]`);
        if (!element) {
          element = document.createElement('meta');
          if (tag.property) {
            element.setAttribute('property', tag.property);
          }
          if (tag.name) {
            element.setAttribute('name', tag.name);
          }
          document.head.appendChild(element);
        }
        element.setAttribute('content', tag.content);
      });

      // Update title
      document.title = `Bukti Pembayaran - ${orderNumber || 'Order'}`;
    }
  }, [cloudinaryUrl, orderNumber]);

  if (!cloudinaryUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">❌ Link Tidak Valid</h1>
          <p className="text-gray-600">Url bukti pembayaran tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">✅ Pembayaran Dikonfirmasi</h1>
          {orderNumber && <p className="text-lg opacity-90">Order: {orderNumber}</p>}
        </div>

        {/* Image Container */}
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-96">
            <img
              src={cloudinaryUrl}
              alt="Bukti Pembayaran"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </div>

        {/* Footer Message */}
        <div className="bg-gray-50 p-6 text-center border-t">
          <p className="text-gray-700 mb-3">Terima kasih atas pemesanan Anda!</p>
          <p className="text-sm text-gray-500">
            Bukti pembayaran telah berhasil disimpan. Pesanan Anda sedang diproses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentProof() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentProofContent />
    </Suspense>
  );
}
