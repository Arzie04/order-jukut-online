'use client';

import { useState, useEffect } from 'react';
import OrderingPage from './components/OrderingPage';
import LoadingScreen from './components/LoadingScreen';
import { API_URLS } from './lib/api-config';

interface StockItem {
  id_item: string;
  nama_item: string;
  stok: number;
  status: 'Tersedia' | 'Hampir Habis' | 'Terjual Habis';
  catatan: string;
  cell_nama?: string;
  cell_stok?: string;
  cell_status?: string;
  link_stok?: string;
  link_status?: string;
}

interface ConfigData {
  jamBuka: string | null;
  jamTutup: string | null;
  maxOrders: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    config: true,
    stock: true,
    itemCount: true
  });
  const [minimumLoadingComplete, setMinimumLoadingComplete] = useState(false);
  
  // Data yang akan dikirim ke OrderingPage
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [orderCount, setOrderCount] = useState<number>(0);

  // fetch configuration (jam buka/tutup, max pesanan) from API
  const fetchConfig = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, config: true }));
      const res = await fetch(API_URLS.CONFIG);
      const data = await res.json();
      console.log('[CONFIG-API] raw config:', data);
      
      const jamBuka =
        typeof data.jam_buka === 'string' && data.jam_buka.trim() !== ''
          ? data.jam_buka.trim()
          : null;
      const jamTutup =
        typeof data.jam_tutup === 'string' && data.jam_tutup.trim() !== ''
          ? data.jam_tutup.trim()
          : null;
      
      let cfgMax = 15;
      if (typeof data.max_pesanan === 'number') {
        cfgMax = data.max_pesanan;
      } else if (data.max_pesanan != null) {
        const parsed = parseInt(String(data.max_pesanan), 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          cfgMax = parsed;
        }
      }

      const config = {
        jamBuka,
        jamTutup,
        maxOrders: cfgMax,
      };
      
      setConfigData(config);
      setLoadingStates(prev => ({ ...prev, config: false }));
      return config;
    } catch (e) {
      console.error('unable to fetch config', e);
      setLoadingStates(prev => ({ ...prev, config: false }));
      return null;
    }
  };

  const fetchStock = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, stock: true }));
      // Try to fetch items with links first
      const resWithLinks = await fetch(
        'https://script.google.com/macros/s/AKfycbxEVHfzLO5ghRZg-f5A2KsYROBALRqTcAPQQ9nxX2tmU1KEaZWisoYyvJA19RPRu8Kf/exec?api=itemsWithLinks'
      );
      const dataWithLinks = await resWithLinks.json();
    
      if (Array.isArray(dataWithLinks) && dataWithLinks.length > 0) {
        setStockData(dataWithLinks);
        console.log('[STOCK-API] items with links data:', dataWithLinks);
        setLoadingStates(prev => ({ ...prev, stock: false }));
        return dataWithLinks;
      }
    
      // Fallback to regular stock API
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbxEVHfzLO5ghRZg-f5A2KsYROBALRqTcAPQQ9nxX2tmU1KEaZWisoYyvJA19RPRu8Kf/exec?api=stock'
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setStockData(data);
      }
      console.log('[STOCK-API] fallback raw data:', data);
      setLoadingStates(prev => ({ ...prev, stock: false }));
      return data;
    } catch (e) {
      console.error('unable to fetch stock', e);
      setLoadingStates(prev => ({ ...prev, stock: false }));
      return [];
    }
  };

  // hit spreadsheet API to get today's total item count (per item, not per customer)
  const fetchOrderCount = async () => {
    try {
      const res = await fetch(API_URLS.ORDER_ITEM_COUNT);
      const data = await res.json();
      console.log('[ORDER-ITEM-COUNT-API] raw data:', data);
      
      let count = 0;
      if (data && typeof data === 'object') {
        // API orderItemCount returns { itemCount, orderCount, date }
        count = data.itemCount || 0;
      }
      
      console.log('[ORDER-ITEM-COUNT-API] total item count:', count);
      setOrderCount(count);
      setLoadingStates(prev => ({ ...prev, itemCount: false }));
      return count;
    } catch (e) {
      console.error('unable to fetch item count', e);
      setLoadingStates(prev => ({ ...prev, itemCount: false }));
      return 0;
    }
  };

  // useEffect untuk minimum loading timer 5 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoadingComplete(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // useEffect untuk mengecek apakah semua loading states sudah selesai
  useEffect(() => {
    const allApiCallsComplete = !loadingStates.config && !loadingStates.stock && !loadingStates.itemCount;
    
    if (allApiCallsComplete && minimumLoadingComplete) {
      setIsLoading(false);
    }
  }, [loadingStates, minimumLoadingComplete]);

  // Load data saat component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchConfig(),
        fetchStock(),
        fetchOrderCount()
      ]);
    };

    loadData();
  }, []);

  // Tampilkan loading screen selama loading
  if (isLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  // Tampilkan OrderingPage setelah loading selesai dengan data yang sudah dimuat
  return (
    <OrderingPage 
      initialConfigData={configData}
      initialStockData={stockData}
      initialOrderCount={orderCount}
    />
  );
}
