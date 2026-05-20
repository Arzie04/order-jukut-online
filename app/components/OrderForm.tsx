'use client';

import { useState } from 'react';

import OrderButtonGrid from './OrderButtonGrid';
import CurrentOrder from './CurrentOrder';
import DeliveryMapPicker from './DeliveryMapPicker';

import type { DeliveryLocation, OrderType } from '@/app/lib/delivery';

interface OrderItem {
  code: string;
  qty: number;
}
interface StockItem {
  nama_item: string;
  stok: number;
}

interface OrderFormProps {
  name: string;
  setName: (name: string) => void;
  note: string;
  setNote: (note: string) => void;
  orderType: OrderType;
  setOrderType: (orderType: OrderType) => void;
  deliveryDriverNote: string;
  setDeliveryDriverNote: (note: string) => void;
  deliveryWhatsapp: string;
  setDeliveryWhatsapp: (value: string) => void;
  deliveryLocation: DeliveryLocation | null;
  onDeliveryLocationConfirm: (location: DeliveryLocation) => void;
  deliveryDistanceKm: number | null;
  deliveryFee: number;
  deliveryLocationError?: string | null;
  deliveryDistanceError?: string | null;
  deliveryDistanceSource?: 'road' | 'haversine' | null;
  isCalculatingDelivery?: boolean;
  deliveryEnabled: boolean;
  standbyDrivers: number;
  isStoreOpen: boolean;
  statusReason: string | null;
  showCalcResult: boolean;
  calcDetails: string;
  calculateTotal: () => void;
  handleOpenConfirm: () => Promise<boolean>;
  isCheckingLatestData?: boolean;
  isSubmitting?: boolean;
  
  // New props for button-based UI
  orderItems: OrderItem[];
  handleAddOrUpdateItem: (code: string, qty?: number) => void;
  handleMovePackageVariant: (code: string, targetVariant: 'SI' | 'SB') => void;
  foodTotal: number;
  total: number;
  priceMap: { [key: string]: number };
  minimumOrderAmount: number;
  isMinimumOrderMet: boolean;
  stock: StockItem[];
}

export default function OrderForm({
  name,
  setName,
  note,
  setNote,
  orderType,
  setOrderType,
  deliveryDriverNote,
  setDeliveryDriverNote,
  deliveryWhatsapp,
  setDeliveryWhatsapp,
  deliveryLocation,
  onDeliveryLocationConfirm,
  deliveryDistanceKm,
  deliveryFee,
  deliveryLocationError,
  deliveryDistanceError,
  deliveryDistanceSource,
  isCalculatingDelivery,
  deliveryEnabled,
  standbyDrivers,
  isStoreOpen,
  statusReason,
  showCalcResult,
  calcDetails,
  calculateTotal,
  handleOpenConfirm,
  orderItems,
  handleAddOrUpdateItem,
  handleMovePackageVariant,
  foodTotal,
  total,
  priceMap,
  isCheckingLatestData,
  isSubmitting,
  minimumOrderAmount,
  isMinimumOrderMet,
  stock,
}: OrderFormProps) {
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const handleUpdateQty = (code: string, newQty: number) => {
    if (newQty > 0) {
      handleAddOrUpdateItem(code, newQty);
    } else {
      // Remove item if qty is 0 or less
      handleAddOrUpdateItem(code, 0);
    }
  };

  const handleAddItem = (code: string) => {
    const existingItem = orderItems.find(item => item.code === code);
    const currentQty = existingItem ? existingItem.qty : 0;
    handleAddOrUpdateItem(code, currentQty + 1);
  };

  return (
    <>
    <form className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-x-8 lg:gap-y-0 items-start">
      {/* 1. Menu Grid */}
      {/* Mobile: Urutan 1. Desktop: Kolom Kiri, Span ke bawah */}
      <div className="lg:col-span-8 lg:row-start-1 lg:row-span-5">
        <div className="bg-black/10 p-4 md:p-6 rounded-2xl border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <label className="block font-semibold lg:text-xl lg:font-bold text-gray-800">
               <span className="lg:hidden">Pilih Menu</span>
               <span className="hidden lg:inline">Daftar Menu</span>
            </label>
          </div>
          
          <OrderButtonGrid
            onAddItem={handleAddItem}
            stock={stock}
          />
        </div>
      </div>

      {/* 2. Name Input */}
      {/* Mobile: Urutan 2. Desktop: Kolom Kanan, Baris 1 (di bawah menu) */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-2">
        <div className="lg:bg-transparent lg:p-6 lg:rounded-t-xl">
          <label className="block font-semibold mb-2 text-gray-800">
            Tipe Pesanan
          </label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                orderType === 'pickup'
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white/60 text-gray-700 hover:bg-white'
              }`}
            >
              Pickup
            </button>
            <button
              type="button"
              onClick={() => {
                if (deliveryEnabled) {
                  setOrderType('delivery');
                }
              }}
              disabled={!deliveryEnabled}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                orderType === 'delivery'
                  ? 'border-green-600 bg-green-600 text-white'
                  : deliveryEnabled
                  ? 'border-gray-300 bg-white/60 text-gray-700 hover:bg-white'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Delivery
            </button>
          </div>
          <div className="mb-5 text-xs font-medium text-gray-600">
            {deliveryEnabled
              ? `Delivery tersedia. Driver standby: ${standbyDrivers}`
              : 'Delivery sedang tidak tersedia'}
          </div>

          <label htmlFor="nameInput" className="block font-semibold mb-2 text-gray-800">
            Nama Pemesan
          </label>
          <div className="flex items-center border border-gray-300/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#66BB6A] transition-all">
            <span className="bg-white/20 px-4 py-3 text-gray-700">👤</span>
            <input
              type="text"
              id="nameInput"
              required
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-3 outline-none bg-white/50"
            />
          </div>

          {orderType === 'delivery' && (
            <div className="mt-5 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">Lokasi Delivery</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Pilih titik tujuan di peta atau gunakan GPS.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Pilih Titik Lokasi
                </button>
              </div>

              {deliveryLocation ? (
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 space-y-2">
                  <div>
                    Titik: {deliveryLocation.latitude.toFixed(6)}, {deliveryLocation.longitude.toFixed(6)}
                  </div>
                  <a
                    href={deliveryLocation.mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-emerald-700 font-semibold"
                  >
                    {deliveryLocation.mapsLink}
                  </a>
                  {deliveryDistanceKm != null && (
                    <div className="text-gray-600">
                      Estimasi jarak {deliveryDistanceKm.toFixed(2)} km, ongkir Rp {deliveryFee.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-white/80 px-4 py-3 text-sm text-gray-500">
                  Belum ada titik delivery yang dipilih.
                </div>
              )}

              {deliveryLocationError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deliveryLocationError}
                </div>
              )}

              <div>
                <label htmlFor="driverWhatsappInput" className="block font-semibold mb-2 text-gray-800">
                  Nomor WhatsApp Pemesan
                </label>
                <input
                  id="driverWhatsappInput"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={deliveryWhatsapp}
                  onChange={(e) => setDeliveryWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl outline-none bg-white/80 focus:ring-2 focus:ring-[#66BB6A] transition-all"
                />
              </div>

              <div>
                <label htmlFor="driverNoteInput" className="block font-semibold mb-2 text-gray-800">
                  Catatan untuk driver
                </label>
                <textarea
                  id="driverNoteInput"
                  rows={2}
                  placeholder="Contoh: rumah pagar hitam, patokan dekat minimarket"
                  value={deliveryDriverNote}
                  onChange={(e) => setDeliveryDriverNote(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl outline-none resize-none bg-white/80 focus:ring-2 focus:ring-[#66BB6A] transition-all"
                />
              </div>

              {isCalculatingDelivery && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Menghitung jarak rute dan ongkir delivery...
                </div>
              )}

              {deliveryDistanceError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {deliveryDistanceError}
                </div>
              )}

              {deliveryDistanceKm != null && (
                <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-xs text-gray-600">
                  Perhitungan jarak: {deliveryDistanceSource === 'road' ? 'rute jalan' : 'garis lurus (fallback)'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Current Order (Cart) */}
      {/* Mobile: Urutan 3. Desktop: Kolom Kanan, Baris 2 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-3">
         <div className="lg:bg-transparent lg:px-6 lg:py-2">
            <CurrentOrder
              order={orderItems}
              onUpdateQty={handleUpdateQty}
              onMovePackageVariant={handleMovePackageVariant}
              foodTotal={foodTotal}
              deliveryFee={deliveryFee}
              total={total}
              priceMap={priceMap}
            />
            <small className="text-gray-700 block mt-2">
              Klik tombol untuk menambah pesanan. Untuk paket, sambal bawang bisa dipindah per 1 porsi dari area &quot;Pesanan Anda&quot;.
            </small>
         </div>
      </div>

      {/* 4. Note Input */}
      {/* Mobile: Urutan 4. Desktop: Kolom Kanan, Baris 3 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-4">
        <div className="lg:bg-transparent lg:px-6 lg:py-4">
          <label htmlFor="noteInput" className="block font-semibold mb-2 text-gray-800">
            Catatan (opsional)
          </label>
          <textarea
            id="noteInput"
            rows={2}
            placeholder="Catatan tambahan contoh: sambal dipisah, diambil jam 17.00"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-xl outline-none resize-none bg-white/50 focus:ring-2 focus:ring-[#66BB6A] transition-all"
          />
        </div>
      </div>

      {/* 5. Warning & Submit */}
      {/* Mobile: Urutan 5. Desktop: Kolom Kanan, Baris 4 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-5">
        <div className="lg:bg-transparent lg:p-6 lg:rounded-b-xl space-y-4 pb-8 lg:pb-6">
          <div className="text-center text-sm text-gray-700 py-2 bg-white/20 rounded-lg">
            Pastikan pesanan benar, kesalahan pesanan karena kesalahan tulis bukan
            tanggung jawab kami
          </div>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={!isStoreOpen || isCheckingLatestData || isSubmitting || !isMinimumOrderMet}
            className={`w-full py-4 font-bold text-lg rounded-xl transition shadow-lg active:scale-[0.98] block ${
              !isMinimumOrderMet
                ? 'bg-red-600 text-white cursor-not-allowed'
                : isStoreOpen && !isCheckingLatestData && !isSubmitting
                ? 'bg-[#2E7D32] text-white hover:opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {!isMinimumOrderMet
              ? 'Minimum transaksi Rp12.000'
              : isSubmitting
              ? 'Sedang memproses pesanan...'
              : isCheckingLatestData
              ? 'Mengecek Stok & Batas Pesanan Terbaru...'
              : 'Pesan Sekarang'}
          </button>
          {!isMinimumOrderMet && (
            <div className="mt-2 text-center text-sm text-red-600 font-semibold">
              {`Minimum transaksi Rp${minimumOrderAmount.toLocaleString('id-ID')}`}
            </div>
          )}
          {!isStoreOpen && (
            <div className="mt-2 text-center text-sm text-red-600 font-semibold">
              {statusReason ||
                'Maaf Outlet sudah tutup atau batas maksimal pesanan tercapai.'}
            </div>
          )}

          <div className="text-center mt-4">
            <a
              href="https://forms.gle/chawC4pDJV7KLApY6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-[#D4E157] text-[#2E7D32] rounded-lg hover:opacity-90 transition text-sm font-bold shadow-md"
            >
              💬 Kritik & Saran
            </a>
          </div>
        </div>
      </div>
    </form>
    <DeliveryMapPicker
      isOpen={isMapPickerOpen}
      initialLocation={deliveryLocation}
      onClose={() => setIsMapPickerOpen(false)}
      onConfirm={(location) => {
        onDeliveryLocationConfirm(location);
        setIsMapPickerOpen(false);
      }}
    />
    </>
  );
}
