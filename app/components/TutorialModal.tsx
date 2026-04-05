'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  openingTimeText: string;
  closingTimeText: string;
}

const TutorialStep = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg sm:text-xl font-bold text-center mb-4 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{title}</h3>
    {children}
  </div>
);

export default function TutorialModal({ isOpen, onClose, openingTimeText, closingTimeText }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      title: '📢PENGUMUMAN PENTING📢',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-lg sm:rounded-xl p-0.5 shadow-lg">
            <div className="bg-gray-900 rounded-[8px] sm:rounded-[10px] p-2 sm:p-4">
              <p className="text-center text-yellow-300 font-bold text-base sm:text-lg mb-2 sm:mb-3">📢 DARI MINKUT 📢</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-red-950/60 border border-red-400/50 rounded-md sm:rounded-lg p-2 sm:p-3">
                  <p className="text-center text-red-100 font-bold text-xs sm:text-sm">
                    Mulai <span className="text-yellow-300 text-sm sm:text-base">6 APRIL 2026</span>
                  </p>
                  <p className="text-center text-red-100 font-bold text-xs sm:text-base mt-1 sm:mt-2">
                    HARGA SEMUA MENU<br className="sm:hidden"/> NAIK <span className="text-yellow-300 text-sm sm:text-lg block">RP 1.000</span> PER ITEM
                  </p>
                </div>
                <p className="text-center text-yellow-50 text-xs">
                  💰 Dikarenakan kenaikan harga plastik kemasan
                </p>
                <div className="bg-green-950/60 border border-green-400/50 rounded-md sm:rounded-lg p-2">
                  <p className="text-center text-green-200 font-bold text-xs sm:text-sm">
                    ✨ <span className="text-green-100">KECUALI</span> ✨
                  </p>
                  <p className="text-center text-green-100 font-semibold text-xs sm:text-sm">
                    Tahu Goreng & Tempe Goreng
                  </p>
                  <p className="text-center text-green-100 text-xs italic">
                    tetap sesuai harga lama, yaa~ 💚
                  </p>
                </div>
                <p className="text-center text-orange-200 text-xs italic bg-orange-950/40 rounded-md sm:rounded-lg p-1.5 sm:p-2">
                  <span className="font-semibold">⚠️ NB:</span> Harga sewaktu-waktu bisa berubah kembali
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '⏰ JAM OPERASIONAL & CARA MEMESAN ⏰',
      content: (
        <div className="space-y-3 text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="bg-blue-950/60 border border-blue-400/50 rounded-md sm:rounded-lg p-2 sm:p-3">
            <p className="text-center font-bold text-blue-100 text-sm">⏰ JAM OPERASIONAL</p>
            <p className="text-center text-blue-50 font-semibold text-sm mt-1">
              {openingTimeText} - {closingTimeText} WIB
            </p>
            <p className="text-center text-blue-50 text-sm italic mt-1">
              atau sampai batas maksimal pesanan hari ini tercapai
            </p>
          </div>
          <div>
            <h6 className="font-bold mb-2 text-white text-sm">📝 CARA MEMESAN</h6>
            <ul className="list-decimal list-inside space-y-1 sm:space-y-2 text-sm">
              <li>Pilih kategori menu (<span className="font-semibold text-green-300">Paket</span>, <span className="font-semibold text-green-300">Non-Paket</span>, dsb).</li>
              <li>Klik gambar atau nama menu yang diinginkan untuk menambahkannya ke pesanan.</li>
              <li>Isi <span className="font-semibold text-yellow-300">Nama Pemesan</span> dan <span className="font-semibold text-yellow-300">Catatan</span> (jika ada).</li>
              <li>Klik <span className="font-semibold text-green-300">"Pesan Sekarang"</span> untuk melanjutkan.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: '⚠️ CATATAN PENTING ⚠️',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
           <ul className="list-disc list-inside space-y-1 sm:space-y-2">
              <li><span className="font-semibold text-green-300">Ati ampela</span> & <span className="font-semibold text-green-300">kulit</span> stok terbatas; jika habis diganti bagian lain.</li>
              <li><span className="font-semibold text-green-300">Sambal bawang</span> stok terbatas; jika habis diganti <span className="font-semibold text-green-300">sambal ijo</span>.</li>
              <li>Jika <span className="font-semibold text-green-300">bagian ayam</span> tidak tersedia, diganti bagian lain yang ada.</li>
              <li><span className="font-semibold text-green-300">Nasi daun jeruk</span> stok sedikit; hanya bisa dipesan saat stok ada di outlet.</li>
              <li className="font-bold text-red-100 bg-red-900/50 p-1.5 sm:p-2 rounded-lg">
                Pesanan dibuat sesuai jam buka outlet & urutan pesanan masuk.
              </li>
            </ul>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(0); // Reset to first step when opened
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white/50 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl max-w-md w-full transform transition-all p-6">
        <div className="min-h-[250px]">
          <TutorialStep title={steps[step].title}>
            {steps[step].content}
          </TutorialStep>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 my-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${step === index ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center gap-4">
          {step > 0 ? (
            <button onClick={handlePrev} className="text-gray-200 font-semibold px-4 py-2">
              Kembali
            </button>
          ) : <div />}
          <button
            onClick={handleNext}
            className="flex-grow bg-[#2E7D32] text-white rounded-lg hover:bg-opacity-90 transition font-semibold shadow-md hover:shadow-lg px-6 py-3"
          >
            {step === steps.length - 1 ? 'Saya Mengerti' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
