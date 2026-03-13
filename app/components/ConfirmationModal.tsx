'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSubmit: () => void;
  isStoreOpen: boolean;
  statusReason: string | null;
  isSubmitting?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  total,
  onSubmit,
  isStoreOpen,
  statusReason,
  isSubmitting = false,
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
      className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/50 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Modal Header */}
        <div className="border-b border-white/20 px-6 py-4 flex justify-between items-center">
          <h5 className="text-xl font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">Konfirmasi Pembayaran</h5>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>        {/* Modal Body */}
        <div className="p-6 text-center space-y-4 max-h-96 overflow-y-auto">
          {/* Cek apakah outlet buka atau tutup */}
          {!isStoreOpen ? (
            <div className="space-y-4">
              <div className="text-red-600 text-6xl">⚠️</div>
              <div className="text-red-500 font-bold text-lg">
                Maaf Outlet tutup atau pesanan online sudah overload, silahkan coba lagi nanti atau datang ke outlet
              </div>
              {statusReason && (
                <div className="text-gray-200 text-sm bg-black/20 p-3 rounded-lg">
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
                  <div className="text-center text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                    <p className="text-sm">QRIS akan muncul dalam</p>
                    <p className="text-3xl font-bold text-[#66BB6A]">{qrisCountdown}</p>
                    <p className="text-sm">detik</p>
                  </div>
                </div>
              )}

              <p className="text-red-300 font-bold text-sm">
                Pastikan harga sudah benar, simpan bukti Pembayaran lalu kirimkan saat
                whatsapp terbuka
              </p>

              <p className="text-lg text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                Total bayar: <span className="font-bold">Rp {total.toLocaleString('id-ID')}</span>
              </p>
            </>
          )}
        </div>        {/* Modal Footer */}
        <div className="border-t border-white/20 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-black/10 text-gray-200 rounded-xl hover:bg-black/20 transition font-semibold"
          >
            {!isStoreOpen ? 'Tutup' : 'Batal'}
          </button>
          {isStoreOpen && (
            <button
              onClick={onSubmit}
              disabled={!buttonEnabled || isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-bold transition shadow-md ${
                buttonEnabled && !isSubmitting
                  ? 'bg-[#2E7D32] text-white hover:opacity-90 cursor-pointer active:scale-95'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? 'Sedang mengecek pesanan...'
                : buttonEnabled
                ? 'Sudah Bayar'
                : `Tunggu ${buttonCountdown}s`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
