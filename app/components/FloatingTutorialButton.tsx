'use client';

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
  };

  return (
    <>
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
        }
      `}</style>
    </>
  );
}