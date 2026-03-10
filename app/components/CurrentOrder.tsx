'use client';

interface OrderItem {
  code: string;
  qty: number;
}

interface CurrentOrderProps {
  order: OrderItem[];
  onUpdateQty: (code: string, newQty: number) => void;
  total: number;
  priceMap: { [key: string]: number };
}

const ITEM_NAMES: Record<string, string> = {
  'PKT PA': 'Paket Ayam Goreng Jukut Paha Atas',
  'PKT PB': 'Paket Ayam Goreng Jukut Paha Bawah',
  'PKT DD': 'Paket Ayam Goreng Jukut Dada',
  'PKT SY': 'Paket Ayam Goreng Jukut Sayap',
  'PKT TD': 'Paket Jukut Telur Dadar',
  'PKT TT': 'Paket Jukut Tahu Tempe',
  'PKT ATI': 'Paket Jukut Ati Ampela',
  'PKT KL': 'Paket Jukut Kulit',
  'PKT PA NDJ': 'Paket Paha Atas (Nasi Daun Jeruk)',
  'PKT PB NDJ': 'Paket Paha Bawah (Nasi Daun Jeruk)',
  'PKT DD NDJ': 'Paket Dada (Nasi Daun Jeruk)',
  'PKT SY NDJ': 'Paket Sayap (Nasi Daun Jeruk)',
  'PKT TD NDJ': 'Paket Telur Dadar (Nasi Daun Jeruk)',
  'PKT TT NDJ': 'Paket Tahu Tempe (Nasi Daun Jeruk)',
  'PKT ATI NDJ': 'Paket Ati Ampela (Nasi Daun Jeruk)',
  'PKT KL NDJ': 'Paket Kulit (Nasi Daun Jeruk)',
  'NP PA': 'Ayam Goreng Jukut Paha Atas',
  'NP PB': 'Ayam Goreng Jukut Paha Bawah',
  'NP DD': 'Ayam Goreng Jukut Dada',
  'NP SY': 'Ayam Goreng Jukut Sayap',
  'NP TD': 'Telur Dadar Jukut',
  'NP ATI': 'Ati Ampela Goreng Jukut',
  'NP KL': 'Kulit Goreng Jukut',
  'EXT NDJ': 'Nasi Daun Jeruk',
  'EXT NSP': 'Nasi Putih',
  'EXT SI': 'Sambal Ijo',
  'EXT SB': 'Sambal Bawang',
  'EXT TP': 'Tempe Goreng',
  'EXT TH': 'Tahu Goreng',
  'EXT JK': 'Jukut Goreng',
  'EXT TG': 'Terong Goreng',
  'EXT KG': 'Kol Goreng',
};

export default function CurrentOrder({ order, onUpdateQty, total, priceMap }: CurrentOrderProps) {
  if (order.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        Belum ada pesanan.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="font-bold text-lg mb-2">Pesanan Anda</h3>
      {order.map(({ code, qty }) => {
        const price = priceMap[code] || 0;
        const subtotal = price * qty;
        
        return (
          <div key={code} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex-1 pr-2">
              <div className="font-semibold text-sm text-gray-800">{ITEM_NAMES[code] || code}</div>
              <div className="text-xs text-gray-500 mt-1">
                Rp {price.toLocaleString('id-ID')} x {qty} = <span className="font-semibold text-gray-700">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateQty(code, qty - 1)}
                className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full font-bold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => onUpdateQty(code, qty + 1)}
                className="w-8 h-8 bg-green-600 text-white rounded-full font-bold flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition shadow-sm"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
      <div className="flex justify-end mt-4 pt-2 border-t border-gray-200">
        <span className="font-bold text-lg">Total: Rp {total.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}
