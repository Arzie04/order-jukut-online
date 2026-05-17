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
    <h3 className="text-xl sm:text-2xl font-extrabold text-center mb-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{title}</h3>
    {children}
  </div>
);

export default function TutorialModal({ isOpen, onClose, openingTimeText, closingTimeText }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      title: '👋 Selamat Datang',
      content: (
        <div className="space-y-4 text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <p className="text-center text-xs text-emerald-100/90">Order online Ayam Jukut Cabe Ijo Jakarta.</p>
          <div className="rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-emerald-900/70 to-green-900/50 p-4 shadow-lg">
            <p className="font-semibold text-emerald-100">Terima kasih sudah memilih Ayam Jukut Cabe Ijo Jakarta.</p>
            <p className="mt-1 text-xs text-emerald-100/90 leading-relaxed">
              Baca ringkasan ini dulu biar proses order kamu makin cepat dan lancar di Ayam Jukut Cabe Ijo Jakarta.
            </p>
          </div>
          <div className="grid gap-2">
            {[
              ['🍗', 'Pesanan diproses fresh setiap hari dengan stok realtime.'],
              ['⚡', 'Flow order sekarang lebih cepat, jelas, dan mobile friendly.'],
              ['🧾', 'Nomor order otomatis muncul begitu pesanan berhasil dibuat.'],
              ['💚', 'Kami terus update sistem agar order kamu makin nyaman.'],
            ].map(([icon, text]) => (
              <div key={text} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs sm:text-sm">
                <span className="mr-2">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '✨ Apa yang Baru?',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <p className="text-center text-cyan-100/90">Update terbaru biar order makin praktis.</p>
          <div className="grid gap-2">
            {[
              ['🚚', 'Delivery Tersedia', 'Pemesanan Delivery kini sudah tersedia di Ayam Jukut Cabe Ijo Jakarta.'],
              ['🔎', 'Cek Status Order', 'Cek status pesanan langsung dari halaman utama.'],
              ['📍', 'Pembaruan UI/UX.', 'Pembaruan UI/UX untuk membuat pengalaman pemesanan lebih baik dan lebih mudah.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-xl border border-cyan-300/50 bg-cyan-900/40 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="inline-flex rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-gray-900">BARU</span>
                </div>
                <div className="mt-1 font-bold text-cyan-100">{title}</div>
                <div className="text-[11px] sm:text-xs text-cyan-100/90">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '⏰ JAM OPERASIONAL & CARA MEMESAN ⏰',
      content: (
        <div className="space-y-4 text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="rounded-2xl border border-blue-300/50 bg-gradient-to-br from-blue-900/70 to-indigo-900/50 p-3 sm:p-4 shadow-lg">
            <p className="text-center font-extrabold text-blue-100 text-sm tracking-wide">⏰ JAM OPERASIONAL</p>
            <p className="text-center text-blue-50 font-semibold text-sm mt-1">
              {openingTimeText} - {closingTimeText} WIB
            </p>
            <p className="text-center text-blue-50/90 text-xs italic mt-1">
              atau sampai batas maksimal pesanan hari ini tercapai
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-300/50 bg-emerald-900/40 p-3 sm:p-4">
            <h6 className="font-extrabold mb-2 text-emerald-100 text-sm">📝 Cara Memesan</h6>
            <div className="space-y-2">
              {[
                ['1', 'Pilih menu', 'Pilih kategori Paket, Non-Paket, atau Extra sesuai selera.'],
                ['2', 'Atur jumlah', 'Tap menu untuk tambah pesanan dan atur qty di Pesanan Anda.'],
                ['3', 'Isi data', 'Isi Nama Pemesan dan Catatan jika ada permintaan khusus.'],
                ['4', 'Lanjut order', 'Klik tombol Pesan Sekarang untuk lanjut ke pembayaran.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="flex gap-2 rounded-xl border border-white/15 bg-white/10 p-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-bold text-emerald-950">
                    {num}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-100">{title}</p>
                    <p className="text-[11px] text-emerald-50/90">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '⚠️ CATATAN PENTING ⚠️',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-left text-gray-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-900/70 to-orange-900/50 p-3 sm:p-4 shadow-lg">
            <p className="text-center font-bold text-amber-100 text-sm">Biar tidak salah paham, cek info ini dulu ya 👇</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <span className="mr-2">•</span>
              <span className="text-[11px] sm:text-xs">
                <span className="font-bold text-yellow-300">Ati Ampela</span> dan{' '}
                <span className="font-bold text-yellow-300">Kulit</span> stok terbatas, jika habis akan diganti bagian lain.
              </span>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <span className="mr-2">•</span>
              <span className="text-[11px] sm:text-xs">
                <span className="font-bold text-yellow-300">Sambal Bawang</span> stok terbatas, jika habis otomatis diganti{' '}
                <span className="font-bold text-green-300">Sambal Ijo</span>.
              </span>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <span className="mr-2">•</span>
              <span className="text-[11px] sm:text-xs">
                Jika bagian <span className="font-bold text-yellow-300">Ayam</span> yang dipilih tidak tersedia, akan diganti bagian yang ready.
              </span>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              <span className="mr-2">•</span>
              <span className="text-[11px] sm:text-xs">
                <span className="font-bold text-green-300">Nasi Daun Jeruk</span> tersedia selama stok di outlet masih ada.
              </span>
            </div>
          </div>
          <div className="font-bold text-red-100 bg-red-900/60 p-2.5 rounded-xl border border-red-300/40 text-xs sm:text-sm">
            🚨 Pesanan diproses sesuai jam buka outlet dan urutan order yang masuk.
          </div>
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
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="bg-white/50 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl max-w-md w-full transform transition-all p-6">
        <div className="mb-3">
          <div className="text-center text-[11px] text-gray-100/90">Panduan Singkat</div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/30">
            <div
              className="h-1.5 rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div key={step} className="min-h-[250px] animate-[fadeSlide_.25s_ease-out]">
          <TutorialStep title={steps[step].title}>
            {steps[step].content}
          </TutorialStep>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 my-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all ${step === index ? 'h-2 w-6 bg-[#2E7D32]' : 'h-2 w-2 bg-gray-300'}`}
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
