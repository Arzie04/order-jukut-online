'use client';

import React, { useEffect, useState, useRef } from 'react';
import { verifyPayment, confirmPayment } from '../lib/payment-verification';
import {
  classifyPaymentError,
  getInvalidImagePresentation,
  type PaymentErrorPresentation,
} from '../lib/payment-errors';

interface AlertModalProps {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'success' | 'info';
  message: string;
  onClose: () => void;
  whatsappUrl?: string;
  whatsappMessage?: string;
  // New props for payment verification
  noOrder?: string;
  totalAmount?: number;
  baseMessage?: string;
  onPaymentConfirmed?: (cloudinaryUrl?: string) => void;
}

export default function AlertModal({
  isOpen,
  type,
  message,
  onClose,
  whatsappUrl,
  whatsappMessage,
  noOrder,
  totalAmount,
  baseMessage,
  onPaymentConfirmed,
}: AlertModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    title?: string;
    message: string;
    presentation?: PaymentErrorPresentation;
  } | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [savedCloudinaryUrl, setSavedCloudinaryUrl] = useState<string>('');
  const [showContinueGuide, setShowContinueGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const continueSectionRef = useRef<HTMLDivElement>(null);
  const lastUploadedFileRef = useRef<File | null>(null);

  const persistProofToStorage = (orderNumber: string, proofUrl: string) => {
    if (typeof window === 'undefined' || !proofUrl) return;
    try {
      const existing = localStorage.getItem('jukut_last_order');
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        'jukut_last_order',
        JSON.stringify({
          ...parsed,
          currentOrderNumber: orderNumber,
          paymentProofUrl: proofUrl,
        })
      );
    } catch (storageError) {
      console.error('[PAYMENT] Failed to persist proof URL:', storageError);
    }
  };
  const shouldShowPaymentIssueAdminContact =
    type === 'success' &&
    noOrder &&
    totalAmount != null &&
    verificationResult &&
    !verificationResult.success;
  const showGenericErrorHelp = type === 'danger' || type === 'warning';

  useEffect(() => {
    if (!(type === 'success' && paymentConfirmed && whatsappUrl && whatsappMessage)) {
      return;
    }

    const timer = setTimeout(() => {
      continueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowContinueGuide(true);
      setTimeout(() => setShowContinueGuide(false), 3500);
    }, 220);

    return () => clearTimeout(timer);
  }, [paymentConfirmed, type, whatsappMessage, whatsappUrl]);
  
  const handleCopyMessage = async () => {
    if (whatsappMessage) {
      try {
        await navigator.clipboard.writeText(whatsappMessage);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy message:', err);
      }
    }
  };

  const runVerification = async (file: File) => {
    if (!noOrder || String(noOrder).trim() === '') {
      const presentation = classifyPaymentError(new Error('Nomor pesanan tidak valid'));
      setVerificationResult({
        success: false,
        title: presentation.title,
        message: presentation.message,
        presentation,
      });
      return;
    }

    if (totalAmount == null || totalAmount <= 0) {
      const presentation = classifyPaymentError(new Error('Jumlah pembayaran tidak valid'));
      setVerificationResult({
        success: false,
        title: presentation.title,
        message: presentation.message,
        presentation,
      });
      return;
    }

    lastUploadedFileRef.current = file;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyPayment(file, totalAmount);

      if (result.isValid && result.cloudinaryUrl) {
        await confirmPayment(noOrder, result.cloudinaryUrl, true);
        persistProofToStorage(noOrder, result.cloudinaryUrl);
        setSavedCloudinaryUrl(result.cloudinaryUrl);
        setVerificationResult({
          success: true,
          title: 'Pembayaran terverifikasi',
          message: 'Bukti pembayaran berhasil disimpan. Lanjutkan pesanan ke WhatsApp.',
        });
        setPaymentConfirmed(true);
        onPaymentConfirmed?.(result.cloudinaryUrl);
        return;
      }

      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      const invalidPresentation = getInvalidImagePresentation();

      if (newRetryCount >= 3) {
        try {
          const { uploadToCloudinary } = await import('../lib/payment-verification');
          const cloudinaryUrl = await uploadToCloudinary(file);
          if (cloudinaryUrl) {
            await confirmPayment(noOrder, cloudinaryUrl, false);
            persistProofToStorage(noOrder, cloudinaryUrl);
            setSavedCloudinaryUrl(cloudinaryUrl);
          }
        } catch (uploadError) {
          console.error('[VERIFY] Manual fallback upload failed:', uploadError);
        }

        setVerificationResult({
          success: false,
          title: 'Verifikasi otomatis belum berhasil',
          message:
            'Kamu masih bisa lanjut manual ke admin. Bukti tetap disimpan jika upload berhasil.',
          presentation: invalidPresentation,
        });
        return;
      }

      setVerificationResult({
        success: false,
        title: invalidPresentation.title,
        message: `${invalidPresentation.message}\n\nPercobaan ${newRetryCount}/3.`,
        presentation: invalidPresentation,
      });
    } catch (error) {
      const presentation = classifyPaymentError(error);
      setVerificationResult({
        success: false,
        title: presentation.title,
        message: presentation.message,
        presentation,
      });
    } finally {
      setIsVerifying(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await runVerification(file);
  };

  const handleRetryVerification = async () => {
    if (!lastUploadedFileRef.current) {
      fileInputRef.current?.click();
      return;
    }
    await runVerification(lastUploadedFileRef.current);
  };

  const handleTeruskanPesanan = () => {
    if (!whatsappUrl) {
      console.warn('WhatsApp URL tidak tersedia');
      return;
    }
    
    // Buka WhatsApp di tab/window baru
    window.open(whatsappUrl, '_blank');
    
    // Reset semua state pesanan dan localStorage setelah redirect
    setTimeout(() => {
      // Clear localStorage completely untuk memulai order baru
      localStorage.removeItem('jukut_last_order');
      // Reload halaman untuk state fresh
      window.location.reload();
    }, 500);
  };

  const handleManualConfirmation = async () => {
    if (!noOrder) {
      console.warn('Order number tidak tersedia');
      return;
    }

    setIsSubmittingManual(true);
    try {
      console.log('Manual confirmation triggered - payment proof already saved');
      // Payment proof already saved on 3rd attempt, just mark as confirmed
      setVerificationResult({
        success: true,
        message: '✅ Pesanan dikonfirmasi! Silakan kirim bukti pembayaran ke admin.'
      });
      setPaymentConfirmed(true);
      onPaymentConfirmed?.(savedCloudinaryUrl);
    } catch (error) {
      console.error('Manual confirmation error:', error);
      setVerificationResult({
        success: false,
        message: '❌ Gagal mengkonfirmasi pesanan. Silakan coba lagi atau hubungi admin.'
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  if (!isOpen) return null;

  const bgColor: Record<string, string> = {
    danger: 'bg-red-50',
    warning: 'bg-yellow-50',
    success: 'bg-green-50',
    info: 'bg-blue-50',
  };

  const titleColor: Record<string, string> = {
    danger: 'text-red-700',
    warning: 'text-yellow-700',
    success: 'text-green-700',
    info: 'text-blue-700',
  };

  const buttonColor: Record<string, string> = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    success: 'bg-green-600 hover:bg-green-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  const iconEmoji: Record<string, string> = {
    danger: '❌',
    warning: '⚠️',
    success: '🎉',
    info: 'ℹ️',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7), 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0), 0 0 0 20px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0), 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        @keyframes blink-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes border-pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.3);
          }
        }
        .shockwave-button {
          animation: pulse-ring 2s infinite;
        }
        .blink-button {
          animation: blink-glow 2.5s infinite;
        }
        .pulse-border {
          animation: border-pulse 2s infinite;
        }
      `}</style>
      <div className={`${bgColor[type]} rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg lg:max-w-lg border border-white/50 transform transition-all scale-100 overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="p-6 md:p-8 lg:p-8 overflow-y-auto flex-1">
          <div className="text-center mb-5 md:mb-6 lg:mb-5">
            <div className="text-5xl md:text-6xl lg:text-6xl mb-3 md:mb-4 animate-bounce">
                {iconEmoji[type]}
            </div>
            <h2 className={`text-xl md:text-2xl lg:text-2xl font-bold ${titleColor[type]}`}>
                {type === 'success' ? 'Pesanan Berhasil! ✨' : 'Pemberitahuan'}
            </h2>
          </div>

          <p className="text-gray-700 mb-4 text-center leading-relaxed text-sm md:text-base font-semibold">
            {message}
          </p>

          {type === 'success' && noOrder && (
            <div className="mb-4 rounded-2xl border-2 border-green-300 bg-white px-4 py-4 text-center shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-green-700">Nomor Order</div>
              <div className="mt-1 text-4xl font-extrabold tracking-wide text-green-800 md:text-5xl">{noOrder}</div>
            </div>
          )}

          {/* Admin Contact - Show for danger/warning alerts */}
          {showGenericErrorHelp && (
            <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
              <div className="bg-white border-2 border-amber-300 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-5 text-center shadow-sm">
                <p className="text-sm md:text-base text-amber-900 font-bold leading-relaxed">
                  Ada kendala? Coba muat ulang / refresh halaman. Jika masih ada kendala, hubungi admin.
                </p>
              </div>
              <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-5 text-center shadow-sm">
                <p className="text-xs md:text-sm lg:text-xs text-red-700 font-bold mb-2 md:mb-3 uppercase">📱 Ada Kendala? Hubungi Admin</p>
                <a 
                  href="https://wa.me/62882007448066" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block text-sm md:text-base lg:text-base font-bold text-red-900 font-mono hover:text-white bg-gradient-to-r hover:from-red-600 hover:to-orange-600 px-4 py-2 rounded-lg transition-all duration-300 active:scale-95"
                >
                  💬 +62 882-0074-48066 (WhatsApp)
                </a>
              </div>
            </div>
          )}

          {/* Verifikasi Pembayaran — langsung di bawah nomor order */}
          {type === 'success' && noOrder && totalAmount != null && (
            <div className="mb-6 space-y-3">
              <div className="rounded-xl border-2 border-fuchsia-300 bg-gradient-to-r from-fuchsia-50 to-indigo-50 p-3 text-center">
                <p className="text-sm font-extrabold text-fuchsia-900">Verifikasi Pembayaran</p>
                <p className="mt-1 text-xs text-fuchsia-800">
                  Upload screenshot bukti transfer QRIS. Nominal dicek otomatis.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isVerifying || paymentConfirmed}
                  className="hidden"
                  id="payment-proof"
                />
                <label
                  htmlFor="payment-proof"
                  className={`block w-full px-6 md:px-8 lg:px-8 py-5 md:py-6 lg:py-6 bg-gradient-to-r from-fuchsia-600 to-indigo-700 text-white rounded-2xl transition-all font-extrabold text-center shadow-2xl hover:shadow-2xl active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-3 md:gap-4 lg:gap-3 group relative overflow-hidden cursor-pointer ${
                    isVerifying || paymentConfirmed ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"></span>
                  <span className="text-2xl md:text-3xl lg:text-3xl group-hover:scale-125 transition-transform relative z-10">
                    {isVerifying ? '⏳' : paymentConfirmed ? '✅' : '⬆️'}
                  </span>
                  <span className="text-base md:text-lg font-bold relative z-10">
                    {isVerifying
                      ? 'Sedang Memverifikasi...'
                      : paymentConfirmed
                      ? 'Pembayaran Terverifikasi'
                      : 'Verifikasi Pembayaran'}
                  </span>
                </label>
              </div>

              {verificationResult && (
                <div
                  className={`rounded-xl border-2 p-4 ${
                    verificationResult.success
                      ? 'border-green-400 bg-green-50 text-green-800'
                      : verificationResult.presentation?.kind === 'system'
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-orange-300 bg-orange-50 text-orange-900'
                  }`}
                >
                  {verificationResult.title && (
                    <p className="text-sm font-bold">{verificationResult.title}</p>
                  )}
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                    {verificationResult.message}
                  </p>
                  {!verificationResult.success && verificationResult.presentation && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {verificationResult.presentation.showRefresh && (
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow border border-gray-200"
                        >
                          Refresh Halaman
                        </button>
                      )}
                      {verificationResult.presentation.showRetry && (
                        <button
                          type="button"
                          onClick={handleRetryVerification}
                          disabled={isVerifying}
                          className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white shadow"
                        >
                          Coba Lagi
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {shouldShowPaymentIssueAdminContact && (
                <div className="p-4 rounded-xl border-2 border-red-400 bg-gradient-to-r from-red-50 to-orange-50 text-center space-y-3">
                  <p className="text-sm text-red-900 font-semibold leading-relaxed">
                    Ada kendala? Coba muat ulang / refresh halaman. Jika masih ada kendala, hubungi admin.
                  </p>
                  <p className="text-sm font-bold text-red-900">
                    Ada kendala saat upload atau verifikasi bukti pembayaran?
                  </p>
                  <p className="text-xs text-red-800 font-medium">
                    Hubungi admin sekarang agar pesanan bisa dibantu cek manual.
                  </p>
                  <a
                    href="https://wa.me/62882007448066"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full px-4 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 transition-all active:scale-95"
                  >
                    Hubungi Admin WhatsApp
                  </a>
                </div>
              )}

              {/* Manual Confirmation Button - Show after 3 failed attempts */}
              {retryCount >= 3 && !paymentConfirmed && (
                <div className="mt-4 p-4 rounded-xl border-2 border-orange-400 bg-orange-50 space-y-3">
                  <p className="text-sm font-bold text-orange-900">
                    💡 Opsi: Lanjutkan dengan Konfirmasi Manual
                  </p>
                  <p className="text-xs text-orange-800">
                    Kirim bukti pembayaran langsung ke admin bersama pesan pesanan tanpa verifikasi otomatis.
                  </p>
                  <button
                    onClick={handleManualConfirmation}
                    disabled={isSubmittingManual}
                    className={`w-full px-6 py-3 rounded-lg font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isSubmittingManual
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    <span className="text-lg">
                      {isSubmittingManual ? '⏳' : '📬'}
                    </span>
                    <span>
                      {isSubmittingManual ? 'Memproses...' : 'Konfirmasi Manual'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {type === 'success' && paymentConfirmed && retryCount >= 3 && (
            <div className="mb-6 md:mb-8 space-y-4 md:space-y-5 lg:space-y-4">
              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 md:p-4 lg:p-4">
                <p className="text-xs md:text-sm lg:text-xs text-blue-900 font-semibold text-center">
                  ℹ️ Order Anda telah disimpan. Kirim pesan di bawah ke admin bersama bukti pembayaran melalui WhatsApp.
                </p>
              </div>

              {/* Manual Template Message - same format as automatic, just without link */}
              <div className="space-y-3 md:space-y-4 lg:space-y-3">
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 md:p-5 lg:p-5">
                      <p className="text-xs md:text-sm lg:text-xs text-yellow-700 font-bold mb-3 md:mb-4 uppercase">📋 Template Pesan untuk Admin (Salin & Kirim):</p>
                      <div className="text-xs md:text-sm lg:text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-48 md:max-h-56 overflow-y-auto bg-white rounded p-3 md:p-4 border border-gray-300 leading-relaxed">
{baseMessage ? `${baseMessage}${savedCloudinaryUrl ? 'Bukti Pembayaran :' : 'Konfirmasi Manual By Chat'}` : `!!JANGAN UBAH PESAN INI!!

${noOrder}

Pembayaran QRIS

${savedCloudinaryUrl ? 'Bukti Pembayaran :' : 'Konfirmasi Manual By Chat'}`}
                      </div>
                  </div>
                  
                  <button
                  onClick={() => {
                    const manualMessage = baseMessage 
                      ? `${baseMessage}${savedCloudinaryUrl ? 'Bukti Pembayaran :' : 'Konfirmasi Manual By Chat'}`
                      : `!!JANGAN UBAH PESAN INI!!

${noOrder}

Pembayaran QRIS

${savedCloudinaryUrl ? 'Bukti Pembayaran :' : 'Konfirmasi Manual By Chat'}`;
                    navigator.clipboard.writeText(manualMessage);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className={`w-full px-4 md:px-6 lg:px-6 py-3 md:py-3.5 lg:py-3 text-xs md:text-base lg:text-sm rounded-xl md:rounded-xl transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                      copySuccess 
                      ? 'bg-green-100 text-green-700 border-2 border-green-500 scale-105' 
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  >
                  {copySuccess ? (
                      <><span className="text-lg md:text-xl">✅</span> <span>Berhasil Disalin!</span></>
                  ) : (
                      <><span className="text-lg md:text-xl">📋</span> <span>Salin Pesan</span></>
                  )}
                  </button>
              </div>

              {/* Admin Contact */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg md:rounded-xl p-3 md:p-5 lg:p-5 text-center shadow-sm">
                <p className="text-xs md:text-sm lg:text-xs text-purple-700 font-bold mb-1 md:mb-2 uppercase">📱 Kirim Pesan + Bukti Pembayaran Ke:</p>
                <a href="https://wa.me/62882007448066" target="_blank" rel="noopener noreferrer" className="inline-block text-sm md:text-base lg:text-base font-bold text-purple-900 font-mono hover:text-white bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg transition-all duration-300">+62 882-0074-48066</a>
              </div>
            </div>
          )}

          {type === 'success' && whatsappUrl && whatsappMessage && (
            <div ref={continueSectionRef} className="mb-6 md:mb-8 space-y-4 md:space-y-5 lg:space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-800">
            Langkah 3 · Teruskan Pesanan
          </div>
          {showContinueGuide && (
            <div className="text-center text-emerald-700 animate-bounce">
              <div className="text-2xl">⬇️</div>
            </div>
          )}
          {/* WhatsApp Button dengan Pulse Border */}
          <div className={`pulse-border rounded-xl md:rounded-2xl transition-all ${showContinueGuide ? 'ring-4 ring-emerald-300/70' : ''}`}>
            <button
              onClick={paymentConfirmed ? handleTeruskanPesanan : undefined}
              className={`shockwave-button blink-button w-full px-6 md:px-8 lg:px-8 py-4 md:py-5 lg:py-5 rounded-xl md:rounded-2xl transition-all font-bold text-center shadow-2xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-3 md:gap-4 lg:gap-3 group relative overflow-hidden ${
                paymentConfirmed
                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"></span>
              <span className="text-2xl md:text-3xl lg:text-3xl group-hover:scale-125 transition-transform relative z-10">
                {paymentConfirmed ? '💬' : '🔒'}
              </span>
              <span className="text-base md:text-lg lg:text-lg font-bold relative z-10">
                {paymentConfirmed ? 'Teruskan Pesanan' : 'Verifikasi Pembayaran Terlebih Dahulu'}
              </span>
            </button>
          </div>
              
              {/* Divider */}
              <div className="relative py-3 md:py-4 lg:py-3">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300/50"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 bg-green-50 text-xs md:text-sm lg:text-xs text-gray-500 font-bold uppercase tracking-wider">Atau Salin Pesan Manual</span>
                </div>
              </div>

              {/* Message Box */}
              <div className="space-y-3 md:space-y-4 lg:space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-5 lg:p-5 relative">
                      <p className="text-xs md:text-sm lg:text-xs text-gray-500 font-bold mb-2 md:mb-3 lg:mb-2 uppercase">📋 Pesan yang akan dikirim:</p>
                      <div className="text-xs md:text-sm lg:text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-32 md:max-h-40 overflow-y-auto bg-white rounded p-3 md:p-4 border border-gray-300">
                          {whatsappMessage}
                      </div>
                  </div>
                  
                  <button
                  onClick={handleCopyMessage}
                  className={`w-full px-4 md:px-6 lg:px-6 py-3 md:py-3.5 lg:py-3 text-xs md:text-base lg:text-sm rounded-xl md:rounded-xl transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                      copySuccess 
                      ? 'bg-green-100 text-green-700 border-2 border-green-500 scale-105' 
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  >
                  {copySuccess ? (
                      <><span className="text-lg md:text-xl">✅</span> <span>Berhasil Disalin!</span></>
                  ) : (
                      <><span className="text-lg md:text-xl">📋</span> <span>Salin Pesan</span></>
                  )}
                  </button>
              </div>

              {/* Admin Contact */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg md:rounded-xl p-3 md:p-5 lg:p-5 text-center shadow-sm">
                <p className="text-xs md:text-sm lg:text-xs text-purple-700 font-bold mb-1 md:mb-2 uppercase">📱 Hubungi Admin Jika Ada Kendala</p>
                <a href="https://wa.me/62882007448066" target="_blank" rel="noopener noreferrer" className="inline-block text-sm md:text-base lg:text-base font-bold text-purple-900 font-mono hover:text-white bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg transition-all duration-300">+62 882-0074-48066</a>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full px-4 md:px-6 lg:px-6 py-3 md:py-3.5 lg:py-3 ${buttonColor[type]} text-white rounded-xl md:rounded-xl transition-all font-bold shadow-md active:scale-95 mt-6 md:mt-8 text-xs md:text-base lg:text-sm flex-shrink-0`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
