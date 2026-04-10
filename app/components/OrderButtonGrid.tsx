'use client';

import { useState } from 'react';

const menuItems = {
  'Paket': [
    { name: 'Paket Ayam Goreng Jukut Paha Atas', code: 'PKT PA' },
    { name: 'Paket Ayam Goreng Jukut Paha Bawah', code: 'PKT PB' },
    { name: 'Paket Ayam Goreng Jukut Dada', code: 'PKT DD' },
    { name: 'Paket Ayam Goreng Jukut Sayap', code: 'PKT SY' },
    { name: 'Paket Jukut Telur Dadar', code: 'PKT TD' },
    { name: 'Paket Jukut Tahu Tempe', code: 'PKT TT' },
    { name: 'Paket Jukut Ati Ampela', code: 'PKT ATI' },
    { name: 'Paket Jukut Kulit', code: 'PKT KL' },
  ],
  'Paket NDJ': [
    { name: 'Paket Paha Atas (Nasi Daun Jeruk)', code: 'PKT PA NDJ' },
    { name: 'Paket Paha Bawah (Nasi Daun Jeruk)', code: 'PKT PB NDJ' },
    { name: 'Paket Dada (Nasi Daun Jeruk)', code: 'PKT DD NDJ' },
    { name: 'Paket Sayap (Nasi Daun Jeruk)', code: 'PKT SY NDJ' },
    { name: 'Paket Telur Dadar (Nasi Daun Jeruk)', code: 'PKT TD NDJ' },
    { name: 'Paket Tahu Tempe (Nasi Daun Jeruk)', code: 'PKT TT NDJ' },
    { name: 'Paket Ati Ampela (Nasi Daun Jeruk)', code: 'PKT ATI NDJ' },
    { name: 'Paket Kulit (Nasi Daun Jeruk)', code: 'PKT KL NDJ' },
  ],
  'Non-Paket': [
    { name: 'Ayam Goreng Jukut Paha Atas', code: 'NP PA' },
    { name: 'Ayam Goreng Jukut Paha Bawah', code: 'NP PB' },
    { name: 'Ayam Goreng Jukut Dada', code: 'NP DD' },
    { name: 'Ayam Goreng Jukut Sayap', code: 'NP SY' },
    { name: 'Telur Dadar Jukut', code: 'NP TD' },
    { name: 'Ati Ampela Goreng Jukut', code: 'NP ATI' },
    { name: 'Kulit Goreng Jukut', code: 'NP KL' },
  ],
  'Tambahan': [
    { name: 'Nasi Daun Jeruk', code: 'EXT NDJ' },
    { name: 'Nasi Putih', code: 'EXT NSP' },
    { name: 'Sambal Ijo', code: 'EXT SI' },
    { name: 'Sambal Bawang', code: 'EXT SB' },
    { name: 'Tempe', code: 'EXT TP' },
    { name: 'Tahu', code: 'EXT TH' },
    { name: 'Jukut', code: 'EXT JK' },
    { name: 'Terong', code: 'EXT TG' },
    { name: 'Kol', code: 'EXT KG' },
  ]
};

interface OrderButtonGridProps {
  onAddItem: (code: string) => void;
  isPackageOutOfStock?: boolean;
  isNdjOutOfStock?: boolean;
}

// Mapping from item code to image source
const imageMap: { [key:string]: string } = {
    // Paket regular
    'PKT PA': '/Foto Produk/Paket Paha Atas.webp',
    'PKT PB': '/Foto Produk/Paket Paha Bawah.webp',
    'PKT DD': '/Foto Produk/Paket Dada.webp',
    'PKT SY': '/Foto Produk/Paket Sayap.webp',
    'PKT TD': '/Foto Produk/Paket Telur.webp',
    'PKT ATI': '/Foto Produk/Paket Ati Ampela.webp',
    'PKT KL': '/Foto Produk/Paket Kulit.webp',
    'PKT TT': '/Foto Produk/Paket Tahu Tempe.webp',
    
    // Paket NDJ (same images as Paket)
    'PKT PA NDJ': '/Foto Produk/Paket Paha Atas.webp',
    'PKT PB NDJ': '/Foto Produk/Paket Paha Bawah.webp',
    'PKT DD NDJ': '/Foto Produk/Paket Dada.webp',
    'PKT SY NDJ': '/Foto Produk/Paket Sayap.webp',
    'PKT TD NDJ': '/Foto Produk/Paket Telur.webp',
    'PKT ATI NDJ': '/Foto Produk/Paket Ati Ampela.webp',
    'PKT KL NDJ': '/Foto Produk/Paket Kulit.webp',
    'PKT TT NDJ': '/Foto Produk/Paket Tahu Tempe.webp',
    
    // Non-Paket
    'NP PA': '/Foto Produk/Non Paket Paha Atas.webp',
    'NP PB': '/Foto Produk/Non Paket Paha Bawah.webp',
    'NP DD': '/Foto Produk/Non Paket Dada.webp',
    'NP SY': '/Foto Produk/Non Paket Sayap.webp',
    'NP TD': '/Foto Produk/Non Paket Telur.webp',
    'NP ATI': '/Foto Produk/Non Paket Ati Ampela.webp',
    'NP KL': '/Foto Produk/Non Paket Kulit.webp',
};

export default function OrderButtonGrid({ onAddItem, isPackageOutOfStock, isNdjOutOfStock }: OrderButtonGridProps) {
  const [activeCategory, setActiveCategory] = useState('Paket');

  return (
    <div>
      <div 
        className="flex p-1 bg-white/30 rounded-xl mb-4 sticky top-24 z-20 shadow-sm mx-[-0.5rem] md:mx-0"
      >
        {Object.keys(menuItems).map(category => (
          <button
            type="button"
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeCategory === category
                ? 'bg-white text-[#2E7D32] shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {menuItems[activeCategory as keyof typeof menuItems].map((item) => {
          const imageSrc = imageMap[item.code];
          const isDisabled =
            (isPackageOutOfStock && activeCategory === 'Paket') ||
            (isNdjOutOfStock && activeCategory === 'Paket NDJ');
          
          if (imageSrc) {
            return (
              <button
                type="button"
                key={item.code}
                onClick={() => onAddItem(item.code)}
                disabled={isDisabled}
                className="bg-white/50 border border-white/30 rounded-2xl shadow-sm text-center transition-all duration-150 active:scale-95 active:border-[#D4E157] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-full h-24 bg-black/10">
                  <img src={imageSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="p-2">
                  <p className="text-gray-800 font-semibold text-xs md:text-sm">{item.name}</p>
                </div>
              </button>
            );
          }

          return (
            <button
              type="button"
              key={item.code}
              onClick={() => onAddItem(item.code)}
              disabled={isDisabled}
              className="bg-white/50 hover:bg-white/70 text-gray-800 font-semibold py-3 px-3 border border-white/30 rounded-xl shadow-sm text-xs md:text-sm transition-all duration-100 active:scale-95 active:border-[#D4E157] flex flex-col items-center justify-center text-center h-full min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
