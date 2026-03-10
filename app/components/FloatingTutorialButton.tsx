'use client';

<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';

const steps = [
  {
    targetId: 'tutorial-categories',
    title: 'Pilih Kategori',
    description: 'Pilih kategori menu yang tersedia di sini (Paket, Non-Paket, Tambahan).'
  },
  {
    targetId: 'tutorial-menu-item',
    title: 'Pilih Menu',
    description: 'Klik tombol menu untuk menambahkan makanan ke keranjang pesanan Anda.'
  },
  {
    targetId: 'tutorial-cart',
    title: 'Keranjang Pesanan',
    description: 'Lihat pesanan Anda di sini. Anda bisa menambah atau mengurangi jumlah porsi.'
  },
  {
    targetId: 'nameInput',
    title: 'Nama Pemesan',
    description: 'Wajib isi nama Anda di sini agar kami tahu pesanan ini milik siapa.'
  },
  {
    targetId: 'noteInput',
    title: 'Catatan Tambahan',
    description: 'Tulis request khusus di sini (misal: "Pedas", "Dipisah", "Tanpa Sayur").'
  },
  {
    targetId: 'tutorial-submit-btn',
    title: 'Kirim Pesanan',
    description: 'Setelah semua sesuai, klik tombol ini untuk mengirim pesanan ke WhatsApp kami.'
  }
];

export default function FloatingTutorialButton() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);

  const updateHighlight = () => {
    if (!isActive) return;
    
    const step = steps[currentStep];
    const element = document.getElementById(step.targetId);
    
    if (element) {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get coordinates
      const rect = element.getBoundingClientRect();
      const padding = 8; // Extra padding around the element

      setHighlightStyle({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2),
      });

      // Calculate tooltip position (prefer bottom, fallback to top)
      const tooltipTop = rect.bottom + padding + 10;
      const tooltipLeft = rect.left;
      
      // Check if tooltip fits below, if not put above
      const viewportHeight = window.innerHeight;
      const isBottomOverflow = (rect.bottom + 200) > viewportHeight; // Approx tooltip height

      if (isBottomOverflow) {
         setTooltipStyle({
            bottom: (viewportHeight - rect.top) + padding + 10,
            left: tooltipLeft,
         });
      } else {
         setTooltipStyle({
            top: tooltipTop,
            left: tooltipLeft,
         });
      }
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (isActive) {
      // Small delay to allow rendering/scrolling
      const timer = setTimeout(updateHighlight, 300);
      window.addEventListener('resize', updateHighlight);
      window.addEventListener('scroll', updateHighlight);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateHighlight);
        window.removeEventListener('scroll', updateHighlight);
      };
    }
  }, [isActive, currentStep]);

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
    setIsReady(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsReady(false);
      setCurrentStep(prev => prev + 1);
    } else {
      handleExit();
    }
  };

  const handleExit = () => {
    setIsActive(false);
    setCurrentStep(0);
=======
import React, { useState } from 'react';
import TutorialModal from './TutorialModal';

interface FloatingTutorialButtonProps {
  className?: string;
}

export default function FloatingTutorialButton({ className = '' }: FloatingTutorialButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  const handleButtonClick = () => {
    setShowModal(true);
    setShowBubble(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Show bubble again after modal closes
    setTimeout(() => setShowBubble(true), 1000);
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
  };

  return (
    <>
<<<<<<< HEAD
      {/* Standby Balloon Button */}
      {!isActive && (
        <div className="fixed top-4 right-4 z-50 animate-bounce-slow">
          <button
            onClick={handleStart}
            className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-lg border-2 border-blue-100 font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span className="text-xl">💡</span>
            <span className="text-sm">Butuh Bantuan?</span>
          </button>
        </div>
      )}

      {/* Tutorial Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop with hole (using clip-path or multiple divs, here using simple semi-transparent overlay with z-index tricks) */}
          {/* Actually, a simpler way for "highlight" is a massive border or box-shadow on the highlight box */}
          
          {/* Highlight Box */}
          <div 
            className="absolute border-4 border-yellow-400 rounded-xl transition-all duration-300 ease-in-out shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{
              ...highlightStyle,
              position: 'absolute',
              zIndex: 10000 // Above backdrop
            }}
          />

          {/* Tooltip Card */}
          <div 
            className={`absolute bg-white p-5 rounded-xl shadow-2xl max-w-xs w-full transition-all duration-300 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              ...tooltipStyle,
              zIndex: 10001,
              // Ensure tooltip stays within screen width
              maxWidth: 'calc(100vw - 32px)',
              left: Math.min(Math.max(16, Number(tooltipStyle.left || 0)), window.innerWidth - 340)
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-800">{steps[currentStep].title}</h3>
              <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {currentStep + 1}/{steps.length}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {steps[currentStep].description}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handleExit}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Keluar
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all flex-1"
              >
                {currentStep === steps.length - 1 ? 'Selesai 🎉' : 'Mengerti, Lanjut →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
=======
      {/* Floating Button Container */}
      <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 ${className}`} style={{ position: 'fixed' }}>
        {/* Bubble Text */}
        {showBubble && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2 animate-bounce-gentle">
            <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg relative">
              Tutorial Pesan
              {/* Arrow pointing to button */}
              <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                <div className="w-0 h-0 border-l-8 border-l-blue-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={handleButtonClick}
          className="w-14 h-14 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-gray-200 hover:border-blue-300"
          title="Tutorial Cara Memesan"
        >
          {/* Tutorial Icon */}
          <img
            src="/Logo loading.png"
            alt="Tutorial"
            className="w-8 h-8"
          />
        </button>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showModal} onClose={handleCloseModal} />

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(-50%) translateX(0);
          }
          50% {
            transform: translateY(-50%) translateX(-4px);
          }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
        }
      `}</style>
    </>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
