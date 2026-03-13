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
    <h3 className="text-xl font-bold text-center mb-4 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{title}</h3>
    {children}
  </div>
);

export default function TutorialModal({ isOpen, onClose, openingTimeText, closingTimeText }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      title: '⚠️ HARAP DIBACA ⚠️',
      content: (
        <div className="space-y-4 text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <p className="text-center font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            Pemesanan online hanya dilayani pukul{' '}
            <span className="text-red-500 font-bold">
              {openingTimeText} - {closingTimeText}
            </span>{' '}
            WIB atau sampai batas maksimal pesanan hari ini tercapai.
          </p>
          <div>
            <h6 className="font-bold mb-1 text-white">CARA MEMESAN</h6>
            <ul className="list-disc list-inside space-y-2">
              <li>Pilih kategori menu (<span className="font-semibold text-green-300">Paket</span>, <span className="font-semibold text-green-300">Non-Paket</span>, dll).</li>
              <li>Klik gambar atau nama menu yang diinginkan untuk menambahkannya ke pesanan.</li>
              <li>Isi Nama Pemesan dan Catatan (jika ada), lalu klik "Pesan Sekarang".</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'CATATAN PENTING',
      content: (
        <div className="space-y-3 text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
           <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-green-300">Ati ampela</span> & <span className="font-semibold text-green-300">kulit</span> stok terbatas; jika habis otomatis diganti dengan bagian lain yang ada.</li>
              <li><span className="font-semibold text-green-300">Sambal bawang</span> stok terbatas; jika habis otomatis diganti <span className="font-semibold text-green-300">sambal ijo</span>.</li>
              <li>Jika <span className="font-semibold text-green-300">bagian ayam</span> yang dipesan tidak tersedia, kami akan menggantinya dengan bagian lain yang ada.</li>
              <li><span className="font-semibold text-green-300">Nasi daun jeruk</span> stok hanya sedikit; hanya bisa dipesan di outlet saat stok ada.</li>
              <li className="font-bold text-red-100 bg-red-900/50 p-2 rounded-lg">
                Pesanan masuk akan dibuat sesuai jam buka outlet dan sesuai urutan pesanan.
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
