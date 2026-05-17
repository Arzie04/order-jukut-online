'use client';

interface StockItem {
  id_item: string;
  nama_item: string;
  stok: number;
  status: 'Tersedia' | 'Hampir Habis' | 'Terjual Habis';
  catatan: string;
}

const getStockStatusColor = (status: StockItem['status'] | 'Tidak Tersedia') => {
  switch (status) {
    case 'Tersedia':
      return 'text-green-600';
    case 'Hampir Habis':
      return 'text-yellow-600';
    case 'Terjual Habis':
      return 'text-red-600';
    default:
      return 'text-red-600';
  }
};

const getStockStatusBadge = (status: StockItem['status'] | 'Tidak Tersedia') => {
  if (status === 'Tersedia') return { label: 'Tersedia', color: 'bg-emerald-100 text-emerald-700' };
  if (status === 'Hampir Habis') return { label: 'Hampir Habis', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Habis', color: 'bg-red-100 text-red-700' };
};

export default function StockDisplay({ stock }: { stock: StockItem[] }) {
  return (
    <>
      <div className="mb-6 rounded-2xl border border-orange-100 bg-gradient-to-b from-white to-orange-50/50 p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-gray-800">📦 Stok Hari Ini</h3>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-600 shadow-sm">Realtime</span>
        </div>
        <p className="mb-3 text-xs text-gray-600">Cek ketersediaan menu sebelum order.</p>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3 md:text-sm">
          {[
            'PAHA ATAS',
            'PAHA BAWAH',
            'DADA',
            'SAYAP',
            'ATI AMPELA',
            'KULIT',
            'TELUR DADAR',
            'SAMBAL IJO',
            'SAMBAL BAWANG',
            'TEMPE',
            'TAHU',
            'NASI DAUN JERUK',
            'NASI PUTIH',
            'KOL',
            'TERONG',
          ].map((itemName) => {
            const stockItem = stock.find(
              (item) => item.nama_item.toUpperCase() === itemName
            );
            const status = !stockItem
              ? 'Tidak Tersedia'
              : stockItem.stok <= 0
                ? 'Terjual Habis'
                : stockItem.status;
            const badge = getStockStatusBadge(status);
            const stockAmount = stockItem ? stockItem.stok : 0;
            return (
              <div key={itemName} className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className={`text-[11px] font-bold ${getStockStatusColor(status)}`}>{itemName}</div>                <div className="mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full ${
                      status === 'Tersedia'
                        ? 'bg-emerald-400'
                        : status === 'Hampir Habis'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.max(10, Math.min(100, stockAmount * 10))}%` }}
                  />
                </div>
              </div>
            );
          })}        </div>
      </div>
    </>
  );
}
