'use client';

import { useState, useEffect } from 'react';
import MenuModal from './MenuModal';
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
  const [showMenuModal, setShowMenuModal] = useState(false);
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
          <div className="text-center mb-6">
            <button type="button" onClick={() => setShowMenuModal(true)} className="px-6 py-2 bg-[#2E7D32] text-white rounded-lg hover:bg-opacity-90 transition text-sm md:text-base font-semibold shadow-md hover:shadow-lg">
              📋 Lihat Menu
            </button>
          </div>
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
      <MenuModal isOpen={showMenuModal} onClose={() => setShowMenuModal(false)} />
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
    </div>
  );
}
