
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

// ===================================================================================
//   SAKLAR UNTUK DEVELOPMENT
//   Ubah 'off' menjadi 'on' untuk mengaktifkan halaman ini.
//   Jika 'off', halaman ini akan otomatis redirect ke halaman utama ('/').
const closedPageStatus = 'on';
// ===================================================================================


const ClosedPage = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isInteracted, setIsInteracted] = useState(false);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (closedPageStatus === 'off') {
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
  
  // Listen for keyboard interaction
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

  // Listen for page visibility changes
  useEffect(() => {
    // Jangan jalankan efek ini jika halaman dinonaktifkan
    if (closedPageStatus === 'off') return;

    const handleVisibilityChange = () => {
      if (!audioRef.current) return;
      const audio = audioRef.current;

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      if (document.hidden) {
        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume > 0.01) {
            audio.volume = Math.max(0, audio.volume - 0.05);
          } else {
            audio.volume = 0;
            audio.pause();
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 50);
      } else {
        if (isInteracted) {
          audio.play().catch(e => console.error("Audio play failed on visibility change:", e));
          fadeIntervalRef.current = setInterval(() => {
            if (audio.volume < 0.99) {
              audio.volume = Math.min(1, audio.volume + 0.05);
            } else {
              audio.volume = 1;
              if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            }
          }, 50);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, [isInteracted]);

  // Jika status 'off', tampilkan pesan redirect atau null
  if (closedPageStatus === 'off') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Halaman 'Tutup' dinonaktifkan. Mengalihkan ke halaman utama...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(15px, -20px) rotate(5deg); }
          50% { transform: translate(-10px, 15px) rotate(-5deg); }
          75% { transform: translate(10px, 5px) rotate(3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes drift-reverse {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-15px, 20px) rotate(-5deg); }
          50% { transform: translate(10px, -15px) rotate(5deg); }
          75% { transform: translate(-10px, -5px) rotate(-3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        .ketupat-drift-1 {
          animation: drift 20s ease-in-out infinite;
        }
        
        .ketupat-drift-2 {
          animation: drift-reverse 25s ease-in-out infinite;
        }
      `}</style>
      
      <audio ref={audioRef} src="/sound/Lebaran/fiikuri-eid-mubarak-music-ramadan-ied-al-fitr-vibes-music-318125.mp3" loop hidden muted playsInline />

      {/* Interaction Overlay */}
      {!isInteracted && (
        <div
          onClick={handleInteraction}
          className="absolute inset-0 bg-green-800 bg-opacity-80 flex flex-col items-center justify-center z-30 cursor-pointer text-white text-center p-4 transition-opacity duration-1000"
        >
          <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={100} height={100} className="mb-4 animate-bounce"/>
          <h2 className="text-3xl font-bold mb-2">Selamat Hari Raya Idul Fitri</h2>
          <p className="text-xl">Sentuh layar untuk melanjutkan</p>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`animated-gradient relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-yellow-300 overflow-hidden transition-opacity duration-1000 ${isInteracted ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Floating Ketupat Ornaments */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="ketupat-drift-1 absolute top-10 left-5 opacity-70">
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={60} height={60} />
          </div>
          <div className="ketupat-drift-2 absolute hidden md:block top-1/4 right-20 opacity-50" style={{ animationDelay: '5s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={100} height={100} />
          </div>
          <div className="ketupat-drift-1 absolute bottom-20 left-1/4 opacity-60" style={{ animationDelay: '2s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={80} height={80} />
          </div>
          <div className="ketupat-drift-2 absolute bottom-10 right-5 opacity-70" style={{ animationDelay: '8s', animationDuration: '22s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={70} height={70} />
          </div>
           <div className="ketupat-drift-1 absolute hidden lg:block top-1/2 left-1/3 opacity-40" style={{ animationDelay: '12s', animationDuration: '30s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={130} height={130} />
          </div>
        </div>
        
        <div className="relative z-10 p-6 sm:p-10 bg-white bg-opacity-30 backdrop-blur-lg rounded-2xl shadow-xl text-center text-green-900 flex flex-col items-center max-w-sm sm:max-w-md md:max-w-2xl mx-4">
          <Image
            src="/Logo loading.png"
            alt="Order Jukut Online Logo"
            width={120}
            height={120}
            className="mb-4"
          />
          <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">Info Penting dari Minkut!</h1>
          <p className="text-lg md:text-2xl mb-2 drop-shadow-md">
            Minkut dan segenap tim Ayam Jukut Cabe Ijo Jakarta mengucapkan:
          </p>
          <p className="text-md md:text-xl font-bold text-green-800 drop-shadow-md">
            Selamat Hari Raya Idul Fitri 1445 H.
          </p>
          <p className="text-base md:text-lg drop-shadow-md mb-4">
            Minal Aidin Wal Faidzin, mohon maaf lahir dan batin yaa.
          </p>
          <p className="text-base md:text-lg mt-4 bg-green-800 text-white px-4 py-2 md:px-6 rounded-full shadow-md">
            Outlet akan libur sementara dan buka kembali setelah Lebaran.
          </p>
          <p className="text-sm md:text-md mt-6 drop-shadow-sm">
            Salam hangat, <br /> <strong>Minkut</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default ClosedPage;
