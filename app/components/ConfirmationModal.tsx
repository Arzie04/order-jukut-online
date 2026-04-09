'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateQrisInfo } from '@/app/lib/qris-generator';

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
  const [qrisCountdown, setQrisCountdown] = useState(10);
  const [buttonCountdown, setButtonCountdown] = useState(15);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [qrisInfo, setQrisInfo] = useState<any>(null);

  useEffect(() => {
    if (!modalRef.current) return;

    if (isOpen) {
      modalRef.current.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      // Reset countdown
      setShowQris(false);
      setQrisCountdown(10);
      setButtonCountdown(15);
      setButtonEnabled(false);
      // Generate QRIS dinamis berdasarkan nominal
      const info = generateQrisInfo(total);
      setQrisInfo(info);
    } else {
      modalRef.current.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, total]);

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
      className="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4 lg:p-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-b from-white/70 to-white/50 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-lg transform transition-all overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header dengan gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-5 md:px-8 lg:px-10 py-5 md:py-6 lg:py-6 text-center shadow-lg flex-shrink-0">
          <h5 className="text-2xl md:text-3xl lg:text-3xl font-bold text-white drop-shadow-lg">💳 Konfirmasi Pembayaran</h5>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 lg:p-6 text-center space-y-4 md:space-y-5 lg:space-y-4 overflow-y-auto flex-1">
          {/* Cek apakah outlet buka atau tutup */}
          {!isStoreOpen ? (
            <div className="space-y-4 md:space-y-6 lg:space-y-5">
              <div className="text-6xl md:text-7xl lg:text-7xl animate-bounce">⚠️</div>
              <div className="text-red-600 font-bold text-base md:text-lg lg:text-lg">
                Maaf Outlet tutup atau pesanan online sudah overload, silahkan coba lagi nanti atau datang ke outlet
              </div>
              {statusReason && (
                <div className="text-gray-700 text-xs md:text-sm lg:text-sm bg-yellow-100/50 border border-yellow-400/50 p-4 md:p-5 lg:p-5 rounded-xl">
                  {statusReason}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* QRIS Display Section */}
              {showQris ? (
                <div className="space-y-3 md:space-y-4 lg:space-y-4">
                  {/* Nominal at Top - Highlighted */}
                  {qrisInfo && (
                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl md:rounded-3xl p-4 md:p-5 lg:p-5 shadow-lg transform">
                      <p className="text-xs md:text-sm lg:text-sm text-white font-bold uppercase tracking-wider opacity-90">💰 Total Bayar</p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-lg mt-1 md:mt-2">Rp {qrisInfo.amountFormatted}</p>
                    </div>
                  )}

                  {/* QR Code Container - Compact */}
                  <div className="flex justify-center">
                    <div className="bg-white/97 backdrop-blur p-3 md:p-4 lg:p-4 rounded-2xl md:rounded-3xl shadow-xl border-4 border-green-300/60">
                      {qrisInfo?.qrisCode ? (
                        <QRCodeSVG
                          value={qrisInfo.qrisCode}
                          size={240}
                          level="H"
                          includeMargin={true}
                        />
                      ) : (
                        <img
                          src="/Qris.jpeg"
                          alt="QRIS Payment Fallback"
                          className="w-60 h-60 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Reference & Timestamp - Compact */}
                  {qrisInfo && (
                    <div className="space-y-2 md:space-y-3 lg:space-y-3">
                      <div className="bg-blue-50/80 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-4">
                        <p className="text-[10px] md:text-xs lg:text-xs text-blue-700 font-bold uppercase mb-1 md:mb-1">📋 No. Ref</p>
                        <p className="text-xs md:text-sm lg:text-sm font-mono font-bold text-blue-600 select-all cursor-pointer break-all">
                          {qrisInfo.reference}
                        </p>
                      </div>
                      <div className="text-[10px] md:text-xs lg:text-xs text-gray-600 font-semibold">
                        ⏰ {qrisInfo.timestamp}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Countdown Display */
                <div className="space-y-4 md:space-y-5 lg:space-y-5">
                  {/* Important Box - Prominent */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl md:rounded-2xl lg:rounded-2xl p-4 md:p-5 lg:p-6 shadow-md">
                    <p className="text-sm md:text-base lg:text-lg font-bold text-red-700 mb-2 md:mb-3 lg:mb-3">⚡ PENTING!</p>
                    <ul className="text-xs md:text-sm lg:text-base text-red-800 space-y-1.5 md:space-y-2 lg:space-y-2 text-left list-disc list-inside font-semibold leading-relaxed">
                      <li>Cek nominal sesuai pesanan</li>
                      <li>Scan & bayar di e-wallet</li>
                      <li>Simpan bukti pembayaran</li>
                    </ul>
                  </div>

                  {/* Countdown Section - Center */}
                  <div className="flex flex-col items-center justify-center py-6 md:py-8 lg:py-10 space-y-3 md:space-y-4 lg:space-y-4 bg-gradient-to-b from-green-50/50 to-transparent rounded-2xl md:rounded-3xl lg:rounded-3xl">
                    <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-700">QRIS akan muncul dalam</p>
                    <div className="text-7xl md:text-8xl lg:text-9xl font-black text-green-600 animate-pulse drop-shadow-lg">{qrisCountdown}</div>
                    <p className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Harap tunggu sebentar...</p>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-blue-50/90 border-2 border-blue-300 rounded-xl md:rounded-2xl lg:rounded-2xl p-4 md:p-5 lg:p-6 shadow-md">
                    <p className="text-sm md:text-base lg:text-lg font-bold text-blue-900 mb-2 md:mb-3 lg:mb-3">📱 Cara Bayar:</p>
                    <p className="text-xs md:text-sm lg:text-base text-blue-800 leading-relaxed font-medium">
                      Buka e-wallet → Scan QRIS → Verifikasi nominal → Bayar → Kirim Upload Bukti Pembayaran di halaman berikutnya
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/30 px-5 md:px-8 lg:px-10 py-4 md:py-5 lg:py-5 flex justify-end gap-3 md:gap-4 lg:gap-4 bg-gradient-to-r from-white/50 to-white/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 md:px-7 lg:px-8 py-2.5 md:py-3 lg:py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl md:rounded-xl transition font-semibold text-xs md:text-sm lg:text-sm shadow-md hover:shadow-lg active:scale-95"
          >
            {!isStoreOpen ? 'Tutup' : 'Batal'}
          </button>
          {isStoreOpen && (
            <button
              onClick={onSubmit}
              disabled={!buttonEnabled || isSubmitting}
              className={`px-6 md:px-9 lg:px-10 py-2.5 md:py-3 lg:py-3 rounded-xl md:rounded-xl font-bold transition shadow-lg text-xs md:text-sm lg:text-sm active:scale-95 ${
                buttonEnabled && !isSubmitting
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl hover:from-emerald-600 hover:to-green-700 cursor-pointer'
                  : 'bg-gray-400 text-white cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting
                ? 'Sedang mengecek...'
                : buttonEnabled
                ? '✓ Sudah Bayar'
                : `Tunggu ${buttonCountdown}s`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
