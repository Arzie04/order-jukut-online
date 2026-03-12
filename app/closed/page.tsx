
'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

const ClosedPage = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Memulai pemutaran audio setelah interaksi pengguna (best practice)
    // atau coba putar otomatis dan tangani error jika gagal.
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error("Autoplay Gagal:", error);
          // Mungkin perlu tombol play manual jika autoplay diblokir browser
        }
      }
    };
    playAudio();
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          25% { transform: translate(25px, -30px) rotate(5deg); }
          50% { transform: translate(-20px, 20px) rotate(-5deg); }
          75% { transform: translate(15px, 10px) rotate(3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes drift-reverse {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-25px, 30px) rotate(-5deg); }
          50% { transform: translate(20px, -20px) rotate(5deg); }
          75% { transform: translate(-15px, -10px) rotate(-3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        .ketupat-drift-1 {
          animation: drift 20s ease-in-out infinite;
        }
        
        .ketupat-drift-2 {
          animation: drift-reverse 25s ease-in-out infinite;
        }

        .ketupat-drift-3 {
          animation: drift 15s ease-in-out infinite;
        }
      `}</style>
      <div
        className="animated-gradient relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-yellow-300 overflow-hidden"
      >
        <audio ref={audioRef} src="/sound/Lebaran/fiikuri-eid-mubarak-music-ramadan-ied-al-fitr-vibes-music-318125.mp3" loop autoPlay hidden />
        
        {/* Floating Ketupat Ornaments */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <div className="ketupat-drift-1 absolute top-10 left-10 opacity-70" style={{ animationDelay: '0s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={80} height={80} />
          </div>
          <div className="ketupat-drift-2 absolute top-1/4 right-20 opacity-50" style={{ animationDelay: '5s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={120} height={120} />
          </div>
          <div className="ketupat-drift-3 absolute bottom-20 left-1/4 opacity-60" style={{ animationDelay: '2s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={100} height={100} />
          </div>
          <div className="ketupat-drift-1 absolute bottom-10 right-10 opacity-70" style={{ animationDelay: '8s', animationDuration: '22s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={90} height={90} />
          </div>
           <div className="ketupat-drift-2 absolute top-1/2 left-1/3 opacity-40" style={{ animationDelay: '12s', animationDuration: '30s' }}>
            <Image src="/Ornamen/Lebaran/ketupat.png" alt="Ketupat" width={150} height={150} />
          </div>
        </div>
        
        <div className="relative z-10 p-10 bg-white bg-opacity-30 backdrop-blur-lg rounded-2xl shadow-xl text-center text-green-900 flex flex-col items-center">
          <Image
            src="/Logo loading.png"
            alt="Order Jukut Online Logo"
            width={150}
            height={150}
            className="mb-4"
          />
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Info Penting dari Minkut!</h1>
          <p className="text-2xl mb-2 drop-shadow-md">
            Minkut dan segenap tim Ayam Jukut Cabe Ijo Jakarta mengucapkan:
          </p>
          <p className="text-xl font-bold text-green-800 drop-shadow-md">
            Selamat Hari Raya Idul Fitri 1445 H.
          </p>
          <p className="text-lg drop-shadow-md mb-4">
            Minal Aidin Wal Faidzin, mohon maaf lahir dan batin yaa.
          </p>
          <p className="text-lg mt-4 bg-green-800 text-white px-6 py-2 rounded-full shadow-md">
            Outlet akan libur sementara dan buka kembali setelah Lebaran.
          </p>
          <p className="text-md mt-6 drop-shadow-sm">
            Salam hangat, <br /> <strong>Minkut</strong>
          </p>
        </div>
      </div>
    </>
  );
};

export default ClosedPage;
