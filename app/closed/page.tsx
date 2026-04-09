'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { CLOSED_PAGE_STATUS, DEVELOPER_MODE } from '../lib/settings';

const ClosedPage = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isInteracted, setIsInteracted] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (DEVELOPER_MODE) return;

    if (CLOSED_PAGE_STATUS === 'off') {
      window.location.href = '/';
    }
  }, []);

  const handleInteraction = useCallback(() => {
    if (!isInteracted && audioRef.current) {
      setIsInteracted(true);

      const audio = audioRef.current;
      audio.muted = false;
      audio.currentTime = 0;
      audio.play().catch(error => console.error("Audio play failed:", error));

      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume < 0.99) {
          audio.volume = Math.min(1, audio.volume + 0.05);
        } else {
          audio.volume = 1;
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        }
      }, 100);
    }
  }, [isInteracted]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleInteraction]);

  if (!DEVELOPER_MODE && CLOSED_PAGE_STATUS === 'off') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Mengalihkan ke halaman utama...</p>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/sound/soft-ambient.mp3"
        loop
        hidden
        muted
        playsInline
      />

      {/* Interaction Overlay */}
      {!isInteracted && (
        <div
          onClick={handleInteraction}
          className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-30 cursor-pointer text-white text-center p-4 transition-opacity duration-1000"
        >
          <h2 className="text-3xl font-bold mb-2">Maintenance</h2>
          <p className="text-lg">Tap untuk melihat informasi</p>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-600 text-white transition-opacity duration-1000 ${isInteracted ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="p-6 sm:p-10 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-xl text-center flex flex-col items-center max-w-md mx-4">
          <Image
            src="/Logo loading.png"
            alt="Logo"
            width={100}
            height={100}
            className="mb-4"
          />

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Website Sedang Maintenance
          </h1>

          <p className="text-lg mb-4">
            Mohon maaf, saat ini sistem kami sedang dalam proses perbaikan dan pengembangan.
          </p>

          <p className="text-lg mb-4">
            Untuk sementara, kami hanya menerima pesanan melalui:
          </p>

          <div className="bg-white text-black px-4 py-3 rounded-xl mb-4 w-full">
            <p className="font-semibold">• Outlet langsung</p>
            <p className="font-semibold">• ShopeeFood</p>
          </div>

          <p className="text-sm opacity-80">
            Terima kasih atas pengertiannya 🙏
          </p>

          <p className="text-sm mt-4">
            Salam hangat,<br />
            <strong>Ayam Jukut Cabe Ijo</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default ClosedPage;
