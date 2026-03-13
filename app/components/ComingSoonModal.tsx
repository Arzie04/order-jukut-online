'use client';

import React from 'react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-white/50 p-6 text-center">
        <div className="text-5xl mb-3">
             construção
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Coming Soon!
        </h2>
        <p className="text-gray-600 mb-6">
            Fitur ini sedang dalam pengembangan dan akan segera hadir. Terima kasih atas kesabaran Anda!
        </p>
        <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition font-bold"
        >
            Tutup
        </button>
      </div>
    </div>
  );
}
