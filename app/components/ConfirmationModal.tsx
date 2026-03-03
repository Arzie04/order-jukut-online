'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSubmit: () => void;
  isStoreOpen: boolean;
  statusReason: string | null;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  total,
  onSubmit,
  isStoreOpen,
  statusReason,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showQris, setShowQris] = useState(false);
  const [qrisCountdown, setQrisCountdown] = useState(5);
  const [buttonCountdown, setButtonCountdown] = useState(10);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {
    if (!modalRef.current) return;

    if (isOpen) {
      modalRef.current.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      // Reset countdown
      setShowQris(false);
      setQrisCountdown(5);
      setButtonCountdown(10);
      setButtonEnabled(false);
    } else {
      modalRef.current.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Countdown QRIS - tampil setelah 5 detik
  useEffect(() => {
    if (!isOpen) return;

    if (qrisCountdown > 0) {
      const timer = setTimeout(() => {
        setQrisCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowQris(true);
    }
  }, [qrisCountdown, isOpen]);

  // Countdown Button - enable setelah 10 detik
  useEffect(() => {
    if (!isOpen) return;

    if (buttonCountdown > 0) {
      const timer = setTimeout(() => {
        setButtonCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setButtonEnabled(true);
    }
  }, [buttonCountdown, isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h5 className="text-xl font-bold">Konfirmasi Pembayaran</h5>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>        {/* Modal Body */}
        <div className="p-6 text-center space-y-4 max-h-96 overflow-y-auto">
          {/* Cek apakah outlet buka atau tutup */}
          {!isStoreOpen ? (
            <div className="space-y-4">
              <div className="text-red-600 text-6xl">⚠️</div>
              <div className="text-red-600 font-bold text-lg">
                Maaf Outlet tutup atau pesanan online sudah overload, silahkan coba lagi nanti atau datang ke outlet
              </div>
              {statusReason && (
                <div className="text-gray-600 text-sm bg-gray-100 p-3 rounded-lg">
                  {statusReason}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* QRIS dengan countdown */}
              {showQris ? (
                <img
                  src="/Qris.jpeg"
                  alt="QRIS"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm">QRIS akan muncul dalam</p>
                    <p className="text-3xl font-bold text-blue-600">{qrisCountdown}</p>
                    <p className="text-gray-600 text-sm">detik</p>
                  </div>
                </div>
              )}

              <p className="text-red-600 font-bold text-sm">
                Pastikan harga sudah benar, simpan bukti Pembayaran lalu kirimkan saat
                whatsapp terbuka
              </p>

              <p className="text-lg">
                Total bayar: <span className="font-bold">Rp {total.toLocaleString('id-ID')}</span>
              </p>
            </>
          )}
        </div>        {/* Modal Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            {!isStoreOpen ? 'Tutup' : 'Batal'}
          </button>
          {isStoreOpen && (
            <button
              onClick={onSubmit}
              disabled={!buttonEnabled}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                buttonEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {buttonEnabled ? 'Sudah Bayar' : `Tunggu ${buttonCountdown}s`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
