'use client';

import React, { useState, useRef } from 'react';
import { verifyPayment, confirmPayment } from '../lib/payment-verification';

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
    message: string;
  } | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [savedCloudinaryUrl, setSavedCloudinaryUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // VALIDATION: Check all required data before proceeding
    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }
    
    if (!noOrder || String(noOrder).trim() === '') {
      console.error('❌ CRITICAL: noOrder is empty or invalid');
      console.error('   noOrder value:', noOrder);
      setVerificationResult({
        success: false,
        message: '❌ ERROR: Nomor pesanan hilang atau tidak valid. Silakan refresh halaman dan coba lagi.'
      });
      return;
    }
    
    if (totalAmount == null || totalAmount <= 0) {
      console.error('❌ CRITICAL: totalAmount is invalid');
      setVerificationResult({
        success: false,
        message: '❌ ERROR: Jumlah pembayaran tidak valid. Silakan refresh halaman dan coba lagi.'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      console.log('🔍 Starting payment verification process...');
      console.log('   Order Number:', noOrder);
      console.log('   Expected Amount:', totalAmount);
      console.log('   File:', file.name, file.size, 'bytes');
      
      const result = await verifyPayment(file, totalAmount);
      console.log('✅ Payment verification result:', result);

      if (result.isValid) {
        console.log('✅ Payment verification successful, confirming payment...');
        console.log('   Sending confirmation to backend with noOrder:', noOrder);
        await confirmPayment(noOrder, result.cloudinaryUrl, true);
        setVerificationResult({
          success: true,
          message: '✅ Pembayaran berhasil diverifikasi! Bukti telah disimpan.'
        });
        setPaymentConfirmed(true);
        // Pass cloudinary URL to parent component
        onPaymentConfirmed?.(result.cloudinaryUrl);
      } else {
        console.log('⚠️ Payment verification failed - invalid payment');
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount >= 3) {
          // On 3rd attempt: upload to Cloudinary and save to database (hidden from user)
          try {
            console.log('🔄 3rd attempt - uploading payment proof to Cloudinary...');
            const { uploadToCloudinary } = await import('../lib/payment-verification');
            const cloudinaryUrl = await uploadToCloudinary(file);
            console.log('✅ Payment proof uploaded to Cloudinary (hidden from user)');
            console.log('   URL:', cloudinaryUrl);
            
            // Save to database with noOrder validation
            console.log('💾 Saving to database with noOrder:', noOrder);
            await confirmPayment(noOrder, cloudinaryUrl, false); // false = payment pending verification
            setSavedCloudinaryUrl(cloudinaryUrl);
            console.log('✅ Payment proof saved to database');
          } catch (uploadError) {
            console.error('❌ Failed to upload on 3rd attempt:', uploadError);
          }
          
          setVerificationResult({
            success: false,
            message: `❌ Verifikasi gagal ${newRetryCount}x. Kirim bukti pembayaran ke admin dengan pesan di bawah.`
          });
        } else {
          setVerificationResult({
            success: false,
            message: `❌ Verifikasi gagal (${newRetryCount}/3). Pastikan bukti pembayaran valid dan jumlah sesuai.`
          });
        }
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = '❌ Terjadi kesalahan saat verifikasi. Silakan coba lagi.';
      
      if (error instanceof Error) {
        if (error.message.includes('Koneksi internet bermasalah')) {
          errorMessage = '❌ Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '❌ Permintaan timeout. Silakan coba lagi dalam beberapa saat.';
        } else if (error.message.includes('konfigurasi server')) {
          errorMessage = '❌ Terjadi masalah server. Silakan hubungi admin.';
        } else if (error.message.includes('Upload to Cloudinary failed')) {
          errorMessage = '❌ Gagal mengupload gambar. Periksa koneksi internet Anda.';
        } else if (error.message.includes('tidak ditemukan di database')) {
          errorMessage = `❌ Nomor pesanan ${noOrder} tidak ditemukan di database. Silakan hubungi admin dengan order number ini: ${noOrder}`;
        } else if (error.message.includes('Gagal mengkonfirmasi pembayaran')) {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      setVerificationResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsVerifying(false);
    }
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
          
          <p className="text-gray-700 mb-6 md:mb-8 text-center leading-relaxed text-sm md:text-base lg:text-base font-semibold">
            {message}
          </p>

          {/* Admin Contact - Show for danger/warning alerts */}
          {(type === 'danger' || type === 'warning') && (
            <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
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

          {/* Payment Verification Section */}
          {type === 'success' && noOrder && totalAmount != null && (
            <div className="mb-6 md:mb-8 space-y-4 md:space-y-5 lg:space-y-4">
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-400 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-6 shadow-md">
                <p className="text-xs md:text-sm lg:text-sm font-bold text-orange-900 mb-3 md:mb-4 lg:mb-3">🔍 VERIFIKASI PEMBAYARAN OTOMATIS:</p>
                <p className="text-xs md:text-sm lg:text-sm text-orange-800 font-semibold leading-snug">
                  Upload bukti pembayaran QRIS untuk verifikasi otomatis. Sistem akan melakukan verifikasi otomatis dan memverifikasi jumlah pembayaran.
                </p>
              </div>

              {/* Instruksi Jelas */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-400 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-6 shadow-md">
                <p className="text-xs md:text-sm lg:text-sm font-bold text-blue-900 mb-3 md:mb-4 lg:mb-3">📝 LANGKAH SELANJUTNYA:</p>
                <ol className="text-xs md:text-sm lg:text-sm text-blue-800 space-y-2 md:space-y-2.5 list-decimal list-inside font-semibold leading-snug">
                  <li>Upload <strong>bukti pembayaran QRIS</strong> (screenshot bukti pembayaran yang jelas)</li>
                  <li>Klik tombol <strong>"TERUSKAN PESANAN"</strong> di bawah</li>
                  <li>Kirim bukti pembayaran ke admin bersama pesan template yang ada jika link bukti pembayaran tidak tersedia</li>
                </ol>
              </div>

              {/* File Upload */}
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
                  className={`block w-full px-6 md:px-8 lg:px-8 py-4 md:py-5 lg:py-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl md:rounded-2xl transition-all font-bold text-center shadow-2xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-3 md:gap-4 lg:gap-3 group relative overflow-hidden cursor-pointer ${
                    isVerifying || paymentConfirmed ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"></span>
                  <span className="text-2xl md:text-3xl lg:text-3xl group-hover:scale-125 transition-transform relative z-10">
                    {isVerifying ? '⏳' : paymentConfirmed ? '✅' : '📤'}
                  </span>
                  <span className="text-base md:text-lg lg:text-lg font-bold relative z-10">
                    {isVerifying ? 'Sedang Memverifikasi...' : paymentConfirmed ? 'Pembayaran Terverifikasi' : 'Upload Bukti Pembayaran'}
                  </span>
                </label>
              </div>

              {/* Verification Result */}
              {verificationResult && (
                <div className={`p-4 rounded-xl border-2 ${
                  verificationResult.success
                    ? 'bg-green-50 border-green-400 text-green-800'
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                  <p className="text-sm font-semibold">{verificationResult.message}</p>
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
{baseMessage ? `${baseMessage}Bukti Pembayaran :` : `!!JANGAN UBAH PESAN INI!!

${noOrder}

Pembayaran QRIS

Bukti Pembayaran :`}
                      </div>
                  </div>
                  
                  <button
                  onClick={() => {
                    const manualMessage = baseMessage 
                      ? `${baseMessage}Bukti Pembayaran :`
                      : `!!JANGAN UBAH PESAN INI!!

${noOrder}

Pembayaran QRIS

Bukti Pembayaran :`;
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
            <div className="mb-6 md:mb-8 space-y-4 md:space-y-5 lg:space-y-4">
          {/* WhatsApp Button dengan Pulse Border */}
          <div className="pulse-border rounded-xl md:rounded-2xl transition-all">
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
                {paymentConfirmed ? 'TERUSKAN PESANAN' : 'VERIFIKASI PEMBAYARAN TERLEBIH DAHULU'}
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
