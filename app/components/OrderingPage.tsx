'use client';

import { useState, useEffect } from 'react';
import MenuModal from './MenuModal';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';
import OrderInstructions from './OrderInstructions';
import StockDisplay from './StockDisplay';
import OrderForm from './OrderForm';

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
  isSubmitting, whatsappUrl, whatsappMessage, priceMap,
  setName, setNote, setAlert, calculateTotal, handleOpenConfirm,
  handleModalSubmit, handleAddOrUpdateItem
}: OrderingPageProps) {
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(!!alert);

  // Effect to handle showing the alert modal when the alert prop changes
  useEffect(() => {
    if (alert) {
      setShowAlertModal(true);
    } else {
      setShowAlertModal(false);
    }
  }, [alert]);

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
    <div className="min-h-screen bg-gray-50 md:pt-4 pb-20 md:pb-8">
      <div className="w-full h-32 md:h-40 bg-white shadow-sm overflow-hidden mb-4 md:mb-6 relative">
        <img src="/Header.jpg" alt="Header" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:hidden"></div>
      </div>
      <div className="container mx-auto px-0 md:px-4">
        <div className="bg-white md:rounded-xl shadow-none md:shadow-lg p-4 md:p-6 min-h-screen md:min-h-0 rounded-t-2xl -mt-4 relative z-10">
          <OrderInstructions openingTimeText={openingTimeText} closingTimeText={closingTimeText} />
          <div className="text-center mb-6">
            <button type="button" onClick={() => setShowMenuModal(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm md:text-base font-semibold">
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
          />
        </div>
      </div>
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
    </div>
  );
}
