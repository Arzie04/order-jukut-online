'use client';

import React, { useState } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  id: number;
  title: string;
  file: string;
  type: 'video' | 'image';
}

const tutorialSteps: TutorialStep[] = [
  { id: 1, title: 'Lihat Menu', file: '/tutorial/1 Lihat menu.mp4', type: 'video' },
  { id: 2, title: 'Isi Pesanan', file: '/tutorial/2 isi pesanan.mp4', type: 'video' },
  { id: 3, title: 'Tunggu QR Code', file: '/tutorial/3 tunggu Qris.jpeg', type: 'image' },
  { id: 4, title: 'Simpan Bukti', file: '/tutorial/4 simpan bukti.mp4', type: 'video' },
  { id: 5, title: 'Masuk WhatsApp', file: '/tutorial/5 masuk wa.mp4', type: 'video' },
  { id: 6, title: 'Kirim WhatsApp', file: '/tutorial/6 kirim wa.jpeg', type: 'image' },
];

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(tutorialSteps.length - 1, prev + 1));
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Cara Memesan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step title */}
          <h3 className="text-lg font-semibold text-center mb-4">
            Langkah {currentStep + 1}: {currentTutorial.title}
          </h3>

          {/* Media content */}
          <div className="flex justify-center mb-6">
            {currentTutorial.type === 'video' ? (
              <video
                key={currentTutorial.file}
                autoPlay
                loop
                muted
                playsInline
                className="max-w-full max-h-96 rounded-lg shadow-lg"
                preload="metadata"
                style={{ outline: 'none' }}
              >
                <source src={currentTutorial.file} type="video/mp4" />
                Browser Anda tidak mendukung video.
              </video>
            ) : (
              <img
                src={currentTutorial.file}
                alt={currentTutorial.title}
                className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
              />
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              ← Sebelumnya
            </button>

            <span className="text-sm text-gray-600">
              {currentStep + 1} dari {tutorialSteps.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentStep === tutorialSteps.length - 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === tutorialSteps.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Selanjutnya →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              Mengerti, Tutup Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}