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

export default function StockDisplay({ stock }: { stock: StockItem[] }) {
  return (
    <>
      <div className="text-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 className="text-lg font-bold mb-2">Stok Hari Ini</h3>
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-xs md:text-sm">
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
            const status = stockItem ? stockItem.status : 'Tidak Tersedia';
            return (
              <div key={itemName} className="flex justify-center items-center bg-white py-1 px-2 rounded-lg shadow-sm border border-gray-100">
                <span className={`font-semibold ${getStockStatusColor(status)}`}>
                  {itemName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mb-6 text-xs text-gray-600">
        <span className="text-green-600">● Tersedia</span> ·
        <span className="text-yellow-500"> ● Hampir Habis</span> ·
        <span className="text-red-600"> ● Terjual Habis</span>
      </div>
    </>
  );
}
