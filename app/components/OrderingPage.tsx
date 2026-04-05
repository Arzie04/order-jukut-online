'use client';

import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';
import TutorialModal from './TutorialModal';
import StockDisplay from './StockDisplay';
import OrderForm from './OrderForm';
import ComingSoonModal from './ComingSoonModal';

// Keep the interfaces, they are needed for props
export interface StockItem {
  id_item: string;
  nama_item: string;
  stok: number;
  status: 'Tersedia' | 'Hampir Habis' | 'Terjual Habis';
  catatan: string;
}

export interface OrderItem {
  code: string;
  qty: number;
}

export interface AlertMessage {
  type: 'danger' | 'warning' | 'success';
  message: string;
}

// This is the new, leaner props interface
export interface OrderingPageProps {
  // State from parent
  name: string;
  note: string;
  total: number;
  calcDetails: string;
  showCalcResult: boolean;
  alert: AlertMessage | null;
  isStoreOpen: boolean;
  statusReason: string | null;
  openingTimeText: string;
  closingTimeText: string;
  stock: StockItem[];
  orderItems: OrderItem[];
  isSubmitting?: boolean; // Add isSubmitting
  whatsappUrl: string;
  whatsappMessage: string;
  priceMap: { [key: string]: number };
  isNdjOutOfStock?: boolean;

  // Handlers from parent
  setName: (name: string) => void;
  setNote: (note: string) => void;
  setAlert: (alert: AlertMessage | null) => void;
  calculateTotal: () => void;
  handleOpenConfirm: () => boolean;
  handleModalSubmit: () => Promise<void>;
  handleAddOrUpdateItem: (code: string, newQty?: number) => void;
}

// The component is now much simpler (presentational)
export default function OrderingPage({
  name, note, total, calcDetails, showCalcResult, alert, isStoreOpen,
  statusReason, openingTimeText, closingTimeText, stock, orderItems,
  isSubmitting, whatsappUrl, whatsappMessage, priceMap, isNdjOutOfStock,
  setName, setNote, setAlert, calculateTotal, handleOpenConfirm,
  handleModalSubmit, handleAddOrUpdateItem
}: OrderingPageProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(!!alert);
  const [showTutorialModal, setShowTutorialModal] = useState(true);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  // Effect to handle showing the alert modal when the alert prop changes
  useEffect(() => {
    if (alert) {
      setShowAlertModal(true);
    } else {
      setShowAlertModal(false);
    }
  }, [alert]);
  
  const handleCloseTutorial = () => {
    setShowTutorialModal(false);
  };

  const closeAlert = () => {
    setShowAlertModal(false);
    setAlert(null); // Notify parent to clear the alert
  }

  const confirmAndSubmit = async () => {
    await handleModalSubmit();
    setShowConfirmModal(false);
  }
  
  const openConfirm = () => {
      const isValid = handleOpenConfirm();
      if (isValid) {
        setShowConfirmModal(true);
      }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* New Modern Sticky Navbar with Glassmorphism */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">AYAM JUKUT CABE IJO JAKARTA</h1>
          <button 
            onClick={() => setShowComingSoonModal(true)} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
          >
            Login
          </button>
        </div>
      </header>
      
      <div className="container mx-auto px-0 md:px-4 mt-4">
        {/* Adjusted content container with glassmorphism */}
        <div className="bg-white/50 backdrop-blur-lg md:rounded-2xl shadow-lg p-4 md:p-6">
          <StockDisplay stock={stock} />
          <OrderForm
            name={name}
            setName={setName}
            note={note}
            setNote={setNote}
            isStoreOpen={isStoreOpen}
            statusReason={statusReason}
            showCalcResult={showCalcResult}
            calcDetails={calcDetails}
            calculateTotal={calculateTotal}
            handleOpenConfirm={openConfirm} // Use the wrapper
            orderItems={orderItems}
            handleAddOrUpdateItem={handleAddOrUpdateItem}
            total={total}
            priceMap={priceMap}
            isNdjOutOfStock={isNdjOutOfStock}
          />
        </div>
      </div>
      <TutorialModal 
        isOpen={showTutorialModal}
        onClose={handleCloseTutorial}
        openingTimeText={openingTimeText}
        closingTimeText={closingTimeText}
      />
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)} 
        total={total} 
        onSubmit={confirmAndSubmit} // Use the wrapper
        isStoreOpen={isStoreOpen} 
        statusReason={statusReason}
        isSubmitting={isSubmitting}
      />
      <AlertModal 
        isOpen={showAlertModal} 
        type={alert?.type || 'info'} 
        message={alert?.message || ''} 
        onClose={closeAlert} // Use the wrapper
        whatsappUrl={whatsappUrl} 
        whatsappMessage={whatsappMessage} 
      />
      <ComingSoonModal isOpen={showComingSoonModal} onClose={() => setShowComingSoonModal(false)} />
      
      {/* Footer */}
      <footer className="bg-white/30 backdrop-blur-sm border-t border-gray-200/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-600 mb-2">
            ℹ️ Web ini masih dalam tahap pengembangan berkelanjutan. Jika masih banyak kekurangan, mohon maaf ya! 🙏
          </p>
          <p className="text-xs text-gray-700 font-semibold">
            Online Order by <span className="text-green-600 font-bold">Arzie</span> © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
