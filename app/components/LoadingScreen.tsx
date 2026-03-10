'use client';

import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
    } else {
      // Tunggu animasi selesai (700ms) sebelum menghapus komponen dari DOM
      const timer = setTimeout(() => setShouldRender(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 bg-white z-[100] flex items-center justify-center transition-opacity duration-700 ease-in-out ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="text-center">
        <img
          src="/Logo loading.png"
          alt="Loading..."
          className="w-32 h-32 md:w-48 md:h-48 mx-auto animate-pulse-slow"
        />
        <div className="mt-4 text-gray-700 font-semibold text-sm md:text-base">
          Sedang menyiapkan jukut...
        </div>
        <div className="flex justify-center items-center gap-1 mt-2">
            <span className="w-2 h-2 bg-green-800 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-green-800 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-green-800 rounded-full animate-bounce"></span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}