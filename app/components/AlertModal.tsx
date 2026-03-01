'use client';

import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'success' | 'info';
  message: string;
  onClose: () => void;
}

export default function AlertModal({
  isOpen,
  type,
  message,
  onClose,
}: AlertModalProps) {
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
      <div className={`${bgColor[type]} rounded-lg shadow-lg max-w-sm w-full border-2 ${borderColor[type]}`}>
        <div className="p-6">
          <h2 className={`text-lg font-bold mb-3 ${titleColor[type]}`}>
            {iconEmoji[type]} Pemberitahuan
          </h2>

          <p className="text-gray-700 mb-6">{message}</p>

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
