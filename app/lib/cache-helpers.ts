/**
 * Helper untuk integrate SWR dengan existing manual fetching di page.tsx
 * Provides cache-aware fetching dengan fallback ke old method
 */

import { cache } from './api-hooks';

export async function fetchStockWithCache(): Promise<any> {
  // Cek cache dulu
  if (cache.isStockFresh() && cache.stock) {
    console.log('✅ Using cached stock data');
    return cache.stock;
  }

  // Cache expired atau kosong, fetch fresh
  console.log('📥 Fetching fresh stock data');
  try {
    const response = await fetch('/api/proxy/stock');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    cache.setStock(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch stock:', error);
    // Fallback ke cache lama jika ada
    if (cache.stock) {
      console.warn('⚠️ Using stale cache as fallback');
      return cache.stock;
    }
    throw error;
  }
}

export async function fetchConfigWithCache(): Promise<any> {
  if (cache.isConfigFresh() && cache.config) {
    console.log('✅ Using cached config data');
    return cache.config;
  }

  console.log('📥 Fetching fresh config data');
  try {
    const response = await fetch('/api/proxy/config?api=config');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    cache.setConfig(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch config:', error);
    if (cache.config) {
      console.warn('⚠️ Using stale cache as fallback');
      return cache.config;
    }
    throw error;
  }
}

export async function fetchOrdersWithCache(): Promise<any> {
  if (cache.isOrdersFresh() && cache.orders) {
    console.log('✅ Using cached orders data');
    return cache.orders;
  }

  console.log('📥 Fetching fresh orders data');
  try {
    const response = await fetch('/api/proxy/config?api=orders');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    cache.setOrders(data);
    return data;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    if (cache.orders) {
      console.warn('⚠️ Using stale cache as fallback');
      return cache.orders;
    }
    throw error;
  }
}

/**
 * Batch fetch dengan parallel requests dan cache awareness
 */
export async function fetchAllDataWithCache() {
  try {
    const [stock, config, orders] = await Promise.all([
      fetchStockWithCache(),
      fetchConfigWithCache(),
      fetchOrdersWithCache(),
    ]);

    return { stock, config, orders };
  } catch (error) {
    console.error('Failed to fetch all data:', error);
    throw error;
  }
}

/**
 * Manual cache invalidation (call this after mutation)
 */
export function invalidateCache(type: 'stock' | 'config' | 'orders' | 'all') {
  if (type === 'stock' || type === 'all') cache.stock = null;
  if (type === 'config' || type === 'all') cache.config = null;
  if (type === 'orders' || type === 'all') cache.orders = null;
  console.log(`🔄 Invalidated cache: ${type}`);
}
