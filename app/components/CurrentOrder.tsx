'use client';

interface OrderItem {
  code: string;
  qty: number;
}

interface CurrentOrderProps {
  order: OrderItem[];
  onUpdateQty: (code: string, newQty: number) => void;
  onMovePackageVariant: (code: string, targetVariant: 'SI' | 'SB') => void;
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

function parseOrderCode(code: string) {
  const parts = code.trim().split(/\s+/);
  const prefix = parts[0];
  const isPackage = prefix === 'PKT' && parts.length >= 2;
  const isNonPackage = prefix === 'NP' && parts.length >= 2;
  const hasSbVariant = (isPackage || isNonPackage) && parts[parts.length - 1] === 'SB';
  const baseParts = hasSbVariant ? parts.slice(0, -1) : parts;

  return {
    isPackage,
    baseCode: baseParts.join(' '),
    variant: hasSbVariant ? 'SB' as const : 'SI' as const,
  };
}

function getItemName(code: string) {
  const parsedCode = parseOrderCode(code);
  const baseName = ITEM_NAMES[parsedCode.baseCode] || parsedCode.baseCode;
  const prefix = code.trim().split(' ')[0];

  // Only show sambal variant for PKT and NP items
  if (prefix !== 'PKT' && prefix !== 'NP') {
    return baseName;
  }

  return parsedCode.variant === 'SB'
    ? `${baseName} - Sambal Bawang`
    : `${baseName} - Sambal Ijo`;
}

function getItemPrice(code: string, priceMap: { [key: string]: number }) {
  if (priceMap[code] != null) {
    return priceMap[code];
  }

  return priceMap[parseOrderCode(code).baseCode] || 0;
}

export default function CurrentOrder({ order, onUpdateQty, onMovePackageVariant, total, priceMap }: CurrentOrderProps) {
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
        const parsedCode = parseOrderCode(code);
        const price = getItemPrice(code, priceMap);
        const subtotal = price * qty;
        const showVariantUI = parsedCode.isPackage || code.startsWith('NP ');
        
        return (
          <div key={code} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 pr-2">
                <div className="font-semibold text-sm text-gray-800">{getItemName(code)}</div>
                {showVariantUI && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      parsedCode.variant === 'SB'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {parsedCode.variant === 'SB' ? 'SB' : 'SI'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMovePackageVariant(code, parsedCode.variant === 'SB' ? 'SI' : 'SB')}
                      className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      {parsedCode.variant === 'SB' ? 'Kembali ke Sambal Ijo' : 'Ubah 1 ke Sambal Bawang'}
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
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
          </div>
        );
      })}
      <div className="flex justify-end mt-4 pt-2 border-t border-gray-200">
        <span className="font-bold text-lg">Total: Rp {total.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}
