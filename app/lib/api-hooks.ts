import useSWR from 'swr';

// Custom fetcher for JSON responses
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = new Error('API request failed');
    throw error;
  }
  
  return response.json();
};

/**
 * Hook untuk fetch stock data dengan automatic caching & dedup
 * Semua component yang pake hook ini akan cache hit (tidak duplicate request)
 */
export function useStock() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/proxy/stock',
    fetcher,
    {
      revalidateOnFocus: false,           // Jangan refetch saat focus tab
      revalidateOnReconnect: true,        // Refetch saat reconnect internet
      dedupingInterval: 45000,            // Dedup dalam 45 detik (match cache)
      focusThrottleInterval: 600000,      // Throttle focus refetch 10 menit
      errorRetryCount: 3,                 // Retry 3x kalau error
      errorRetryInterval: 5000,           // Retry interval 5 detik
      shouldRetryOnError: true,
    }
  );

  return {
    stock: data,
    isLoading,
    isError: !!error,
    error,
    mutate, // Call ini untuk manual refresh
  };
}

/**
 * Hook untuk fetch config data (opening hours, etc)
 */
export function useConfig() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/proxy/config?api=config',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000,           // Dedup dalam 5 menit (config static)
      focusThrottleInterval: 600000,      // Throttle 10 menit
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    config: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook untuk fetch orders data
 */
export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/proxy/config?api=orders',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,            // Dedup dalam 60 detik
      focusThrottleInterval: 300000,      // Throttle 5 menit
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    orders: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Preload function to fetch data early
 * Panggil ini di page level sebelum render component
 */
export function preloadData() {
  // Preload cache saat app start
  fetcher('/api/proxy/stock').catch(() => {}); // Silent fail
  fetcher('/api/proxy/config?api=config').catch(() => {});
  fetcher('/api/proxy/config?api=orders').catch(() => {});
}

/**
 * Global cache untuk manual control (fallback)
 */
export const cache = {
  stock: null as any,
  config: null as any,
  orders: null as any,
  stockTime: 0,
  configTime: 0,
  ordersTime: 0,

  /**
   * Check if cache is still fresh
   */
  isStockFresh: () => Date.now() - cache.stockTime < 45000,
  isConfigFresh: () => Date.now() - cache.configTime < 300000,
  isOrdersFresh: () => Date.now() - cache.ordersTime < 60000,

  /**
   * Clear all cache
   */
  clear: () => {
    cache.stock = null;
    cache.config = null;
    cache.orders = null;
    cache.stockTime = 0;
    cache.configTime = 0;
    cache.ordersTime = 0;
  },

  /**
   * Manual set cache
   */
  setStock: (data: any) => {
    cache.stock = data;
    cache.stockTime = Date.now();
  },
  setConfig: (data: any) => {
    cache.config = data;
    cache.configTime = Date.now();
  },
  setOrders: (data: any) => {
    cache.orders = data;
    cache.ordersTime = Date.now();
  },
};
