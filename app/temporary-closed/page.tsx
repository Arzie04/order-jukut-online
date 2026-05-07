'use client';

import React from 'react';
import Image from 'next/image';

const TemporaryClosedPage = () => {
  return (
    <>
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

      {/* Main Content */}
      <div
        className="flex flex-col items-center justify-center min-h-screen text-white transition-opacity duration-1000 opacity-100"
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
            🏃‍♂️ Tutup Sementara 🏃‍♀️
          </h1>

          <p className="text-lg mb-6 leading-relaxed">
            Mohon maaf, karena satu dan lain hal, untuk saat ini kami sedang tutup sementara.
          </p>

          <p className="text-lg mb-6 font-semibold">
            Kami akan buka kembali secepatnya. Silakan cek kembali beberapa saat lagi.
          </p>

          <p className="text-sm opacity-90 mb-4">
            Terima kasih atas pengertiannya 🙏
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

export default TemporaryClosedPage;
