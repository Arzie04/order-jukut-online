/**
 * Centralized API configuration for Google Apps Script endpoints
 * This ensures all components use the same API URL and makes updates easier
 */

export const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxEVHfzLO5ghRZg-f5A2KsYROBALRqTcAPQQ9nxX2tmU1KEaZWisoYyvJA19RPRu8Kf/exec',
  
  // API endpoints
  ENDPOINTS: {
    ORDERS: 'orders',
    ORDER_ITEM_COUNT: 'orderItemCount',
    STOCK: 'stock', 
    CONFIG: 'config',
<<<<<<< HEAD
    ITEMS_WITH_LINKS: 'itemsWithLinks',
    UPDATE_STOCK: 'updateStock'
=======
    ITEMS_WITH_LINKS: 'itemsWithLinks'
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
  }
} as const;

/**
 * Helper function to build API URLs
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}?api=${endpoint}`;
}

/**
 * Predefined API URLs for common endpoints
 */
export const API_URLS = {
  ORDERS: buildApiUrl(API_CONFIG.ENDPOINTS.ORDERS),
  ORDER_ITEM_COUNT: buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_ITEM_COUNT),
  STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.STOCK),
  CONFIG: buildApiUrl(API_CONFIG.ENDPOINTS.CONFIG),
<<<<<<< HEAD
  ITEMS_WITH_LINKS: buildApiUrl(API_CONFIG.ENDPOINTS.ITEMS_WITH_LINKS),
  UPDATE_STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_STOCK)
=======
  ITEMS_WITH_LINKS: buildApiUrl(API_CONFIG.ENDPOINTS.ITEMS_WITH_LINKS)
>>>>>>> 6a18c5d82208a9419dde3fabd3415288b0111300
} as const;