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
}

export default function OrderButtonGrid({ onAddItem }: OrderButtonGridProps) {
  const [activeCategory, setActiveCategory] = useState('Paket');

  return (
    <div>
      <div 
        className="flex p-1 bg-gray-100 rounded-xl mb-4 sticky top-0 z-20 shadow-sm mx-[-0.5rem] md:mx-0"
      >
        {Object.keys(menuItems).map(category => (
          <button
            type="button"
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeCategory === category
                ? 'bg-white text-green-700 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {menuItems[activeCategory as keyof typeof menuItems].map((item, index) => (
          <button
            type="button"
            key={item.code}
            onClick={() => onAddItem(item.code)}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-3 border border-gray-200 rounded-xl shadow-sm text-xs md:text-sm transition-all duration-100 active:scale-95 active:bg-green-50 active:border-green-500 flex flex-col items-center justify-center text-center h-full min-h-[60px]"
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
