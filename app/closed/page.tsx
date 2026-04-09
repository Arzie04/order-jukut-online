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
      audio.volume = 0; // Start from 0 for fade in effect
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

  // Fade out audio when page becomes invisible (moved to background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && isInteracted) {
        const audio = audioRef.current;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        
        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.05);
          } else {
            audio.volume = 0;
            audio.pause();
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        src="/sound/Maintenance/Maintenance%20Sound.mp3"
        loop
        hidden
        muted
        playsInline
      />

      {/* Background Container */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/Ornamen/Maintenance/Maintenance Web.webp"
          alt="Maintenance Background"
          fill
          className="object-cover"
          quality={80}
          priority
        />
      </div>

      {/* Dark Overlay for Text Readability */}
      <div className="fixed inset-0 -z-10 bg-black bg-opacity-40" />

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
        className={`flex flex-col items-center justify-center min-h-screen text-white transition-opacity duration-1000 ${isInteracted ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="p-6 sm:p-10 bg-black bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl text-center flex flex-col items-center max-w-md mx-4 border border-gray-600">
          <Image
            src="/Logo loading.png"
            alt="Logo"
            width={120}
            height={120}
            className="mb-6 drop-shadow-lg"
          />

          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-yellow-400">
            🚧 Website Sedang Maintenance 🚧
          </h1>

          <p className="text-lg mb-6 leading-relaxed">
            Mohon maaf, saat ini sistem kami sedang dalam proses perbaikan dan pengembangan untuk memberikan pengalaman yang lebih baik.
          </p>

          <p className="text-lg mb-6 font-semibold">
            Untuk sementara, kami hanya menerima pesanan melalui:
          </p>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-4 rounded-xl mb-6 w-full shadow-lg">
            <p className="font-bold text-lg">🏪 Outlet langsung</p>
            <p className="font-bold text-lg">🍽️ ShopeeFood</p>
          </div>

          <p className="text-sm opacity-90 mb-4">
            Terima kasih atas pengertian dan kesabarannya 🙏
          </p>

          <p className="text-sm mt-4 text-yellow-300">
            Salam hangat,<br />
            <strong className="text-yellow-400">Ayam Jukut Cabe Ijo</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default ClosedPage;
