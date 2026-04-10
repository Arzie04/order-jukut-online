'use client';

import OrderButtonGrid from './OrderButtonGrid';
import CurrentOrder from './CurrentOrder';

interface OrderItem {
  code: string;
  qty: number;
}

interface OrderFormProps {
  name: string;
  setName: (name: string) => void;
  note: string;
  setNote: (note: string) => void;
  isStoreOpen: boolean;
  statusReason: string | null;
  showCalcResult: boolean;
  calcDetails: string;
  calculateTotal: () => void;
  handleOpenConfirm: () => void;
  
  // New props for button-based UI
  orderItems: OrderItem[];
  handleAddOrUpdateItem: (code: string, qty?: number) => void;
  handleMovePackageVariant: (code: string, targetVariant: 'SI' | 'SB') => void;
  total: number;
  priceMap: { [key: string]: number };
  isPackageOutOfStock?: boolean;
  isNdjOutOfStock?: boolean;
}

export default function OrderForm({
  name,
  setName,
  note,
  setNote,
  isStoreOpen,
  statusReason,
  showCalcResult,
  calcDetails,
  calculateTotal,
  handleOpenConfirm,
  orderItems,
  handleAddOrUpdateItem,
  handleMovePackageVariant,
  total,
  priceMap,
  isPackageOutOfStock,
  isNdjOutOfStock,
}: OrderFormProps) {

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
            isPackageOutOfStock={isPackageOutOfStock}
            isNdjOutOfStock={isNdjOutOfStock}
          />
        </div>
      </div>

      {/* 2. Name Input */}
      {/* Mobile: Urutan 2. Desktop: Kolom Kanan, Baris 1 (di bawah menu) */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-2">
        <div className="lg:bg-transparent lg:p-6 lg:rounded-t-xl">
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
            disabled={!isStoreOpen}
            className={`w-full py-4 font-bold text-lg rounded-xl transition shadow-lg active:scale-[0.98] block ${
              isStoreOpen
                ? 'bg-[#2E7D32] text-white hover:opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Pesan Sekarang
          </button>
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
  );
}
