'use client';

import React from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-bounce-zoom">
          <img
            src="/Logo loading.png"
            alt="Loading..."
            className="w-32 h-32 md:w-48 md:h-48 mx-auto"
          />
        </div>
        <div className="mt-4 text-gray-600 text-sm md:text-base">
          Memuat data...
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-zoom {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          25% {
            transform: translateY(-10px) scale(1.1);
          }
          50% {
            transform: translateY(-20px) scale(1.2);
          }
          75% {
            transform: translateY(-10px) scale(1.1);
          }
        }
        
        .animate-bounce-zoom {
          animation: bounce-zoom 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}