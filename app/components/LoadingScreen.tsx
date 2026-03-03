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
        <img
          src="/Logo loading.png"
          alt="Loading..."
          className="w-32 h-32 md:w-48 md:h-48 mx-auto"
        />
        <div className="mt-4 text-gray-600 text-sm md:text-base">
          Memuat data...
        </div>
      </div>
      

    </div>
  );
}