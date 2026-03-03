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

  const borderColor: Record<string, string> = {
    danger: 'border-red-400',
    warning: 'border-yellow-400',
    success: 'border-green-400',
    info: 'border-blue-400',
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
    success: '✅',
    info: 'ℹ️',
  };

  return (
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
                
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
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
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full px-4 py-2 ${buttonColor[type]} text-white rounded-lg transition font-semibold`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
