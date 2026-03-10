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
  total: number;
  priceMap: { [key: string]: number };
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
  total,
  priceMap,
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
    <form className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-y-4 lg:gap-x-8 lg:gap-y-0 items-start">
      {/* 1. Name Input */}
      {/* Mobile: Urutan 1. Desktop: Kolom Kanan, Baris 1 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <div className="lg:bg-white lg:p-6 lg:rounded-t-xl lg:shadow-sm lg:border lg:border-gray-100 lg:border-b-0">
          <label htmlFor="nameInput" className="block font-semibold mb-2">
            Nama Pemesan
          </label>
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
            <span className="bg-gray-50 px-4 py-3 text-gray-500">👤</span>
            <input
              type="text"
              id="nameInput"
              required
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-3 outline-none bg-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Menu Grid */}
      {/* Mobile: Urutan 2. Desktop: Kolom Kiri, Span ke bawah */}
      <div className="lg:col-span-8 lg:row-start-1 lg:row-span-5">
        <div className="lg:bg-white lg:p-6 lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <label className="block font-semibold lg:text-xl lg:font-bold text-gray-800">
               <span className="lg:hidden">Pesanan</span>
               <span className="hidden lg:inline">Daftar Menu</span>
            </label>
          </div>
          
          <OrderButtonGrid onAddItem={handleAddItem} />
        </div>
      </div>

      {/* 3. Current Order (Cart) */}
      {/* Mobile: Urutan 3. Desktop: Kolom Kanan, Baris 2 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-2">
         <div className="lg:bg-white lg:px-6 lg:py-2 lg:shadow-sm lg:border-x lg:border-gray-100">
            <CurrentOrder order={orderItems} onUpdateQty={handleUpdateQty} total={total} priceMap={priceMap} />
            <small className="text-gray-600 block mt-2">
              Klik tombol untuk menambah pesanan. Anda bisa mengatur jumlah di "Pesanan Anda".
            </small>
         </div>
      </div>

      {/* 4. Note Input */}
      {/* Mobile: Urutan 4. Desktop: Kolom Kanan, Baris 3 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-3">
        <div className="lg:bg-white lg:px-6 lg:py-4 lg:shadow-sm lg:border-x lg:border-gray-100">
          <label htmlFor="noteInput" className="block font-semibold mb-2">
            Catatan (opsional)
          </label>
          <textarea
            id="noteInput"
            rows={2}
            placeholder="Catatan tambahan contoh: sambal dipisah, diambil jam 17.00"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* 5. Warning & Submit */}
      {/* Mobile: Urutan 5. Desktop: Kolom Kanan, Baris 4 */}
      <div className="lg:col-span-4 lg:col-start-9 lg:row-start-4">
        <div className="lg:bg-white lg:p-6 lg:rounded-b-xl lg:shadow-sm lg:border lg:border-gray-100 lg:border-t-0 space-y-4">
          <div className="text-center text-sm text-gray-600 py-2 bg-gray-50 rounded-lg">
            Pastikan pesanan benar, kesalahan pesanan karena kesalahan tulis bukan
            tanggung jawab kami
          </div>

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={!isStoreOpen}
            className={`w-full py-4 font-bold text-lg rounded-xl transition shadow-lg active:scale-[0.98] ${
              isStoreOpen
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
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
              className="inline-block px-6 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 transition text-sm font-bold shadow-md"
            >
              💬 Kritik & Saran
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
