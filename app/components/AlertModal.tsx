'use client';

import React, { useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'success' | 'info';
  message: string;
  onClose: () => void;
  whatsappUrl?: string;
  whatsappMessage?: string;
}

export default function AlertModal({
  isOpen,
  type,
  message,
  onClose,
  whatsappUrl,
  whatsappMessage,
}: AlertModalProps) {  const [copySuccess, setCopySuccess] = useState(false);
  
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

  if (!isOpen) return null;

  const bgColor: Record<string, string> = {
    danger: 'bg-red-50',
    warning: 'bg-yellow-50',
    success: 'bg-green-50',
    info: 'bg-blue-50',
  };

<<<<<<< HEAD
=======
  const borderColor: Record<string, string> = {
    danger: 'border-red-400',
    warning: 'border-yellow-400',
    success: 'border-green-400',
    info: 'border-blue-400',
  };

>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
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
<<<<<<< HEAD
    success: '🎉',
=======
    success: '✅',
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
    info: 'ℹ️',
  };

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className={`${bgColor[type]} rounded-2xl shadow-2xl max-w-md w-full border border-white/50 transform transition-all scale-100 overflow-hidden`}>
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-5xl mb-3 animate-bounce">
                {iconEmoji[type]}
            </div>
            <h2 className={`text-xl font-bold ${titleColor[type]}`}>
                {type === 'success' ? 'Pesanan Berhasil!' : 'Pemberitahuan'}
            </h2>
          </div>
          
          <p className="text-gray-700 mb-6 text-center leading-relaxed text-sm md:text-base">
            {message}
          </p>

          {/* Additional WhatsApp content for success type */}
          {type === 'success' && whatsappUrl && whatsappMessage && (
            <div className="mb-6">
              <div className="bg-white/60 backdrop-blur-sm border border-green-100 rounded-xl p-4 shadow-sm">
=======
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${bgColor[type]} rounded-lg shadow-lg max-w-lg w-full border-2 ${borderColor[type]}`}>
        <div className="p-6">
          <h2 className={`text-lg font-bold mb-3 ${titleColor[type]}`}>
            {iconEmoji[type]} Pemberitahuan
          </h2>          <p className="text-gray-700 mb-6">{message}</p>

          {/* Additional WhatsApp content for success type */}
          {type === 'success' && whatsappUrl && whatsappMessage && (
            <div className="mb-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Jika WhatsApp anda tidak terbuka otomatis:</strong>
                </p>
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
                
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
<<<<<<< HEAD
                  className="w-full mb-4 px-4 py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl transition-all font-bold text-center shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📱</span> 
                  <span>Buka WhatsApp</span>
                </a>
                
                <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300/50"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-3 bg-transparent text-[10px] text-gray-400 font-bold uppercase tracking-wider">Atau Manual</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative">
                        <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase">Pesan:</p>
                        <div className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-20 overflow-y-auto">
                            {whatsappMessage}
                        </div>
                    </div>
                    
                    <button
                    onClick={handleCopyMessage}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl transition-all font-bold shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${
                        copySuccess 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    >
                    {copySuccess ? (
                        <><span>✅</span> <span>Tersalin!</span></>
                    ) : (
                        <><span>📋</span> <span>Salin Pesan</span></>
                    )}
                    </button>
                </div>
              </div>
              
              <p className="text-center text-xs text-gray-500 mt-3">
                Nomor Admin: <span className="font-semibold text-gray-700">+62 882-0074-48066</span>
              </p>
=======
                  className="inline-block w-full mb-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold text-center"
                >
                  📱 Klik di Sini untuk WhatsApp
                </a>
                
                <p className="text-sm text-gray-700 mb-2">
                  <strong>atau Salin Pesan di bawah ini dan kirimkan ke WhatsApp Minkut / Admin Jukut</strong>
                </p>
                <p className="text-sm text-blue-600 font-semibold mb-3">
                  +62 882-0074-48066
                </p>
                
                <div className="bg-gray-50 border rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">PESAN YANG DISALIN:</p>
                  <div className="text-xs text-gray-800 whitespace-pre-wrap font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                    {whatsappMessage}
                  </div>
                </div>
                
                <button
                  onClick={handleCopyMessage}
                  className={`w-full px-3 py-2 text-sm rounded-lg transition font-semibold ${
                    copySuccess 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copySuccess ? '✅ Pesan Disalin!' : '📋 Salin Pesan'}
                </button>
              </div>
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
            </div>
          )}

          <button
            onClick={onClose}
<<<<<<< HEAD
            className={`w-full px-4 py-3.5 ${buttonColor[type]} text-white rounded-xl transition-all font-bold shadow-md active:scale-[0.98]`}
=======
            className={`w-full px-4 py-2 ${buttonColor[type]} text-white rounded-lg transition font-semibold`}
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
