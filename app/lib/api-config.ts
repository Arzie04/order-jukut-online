/**
 * Centralized API configuration for Google Apps Script endpoints
 * This ensures all components use the same API URL and makes updates easier
 */

export const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxEVHfzLO5ghRZg-f5A2KsYROBALRqTcAPQQ9nxX2tmU1KEaZWisoYyvJA19RPRu8Kf/exec',
  
  // API endpoints
  ENDPOINTS: {
    ORDERS: 'orders',
    STOCK: 'stock', 
    CONFIG: 'config',
    ITEMS_WITH_LINKS: 'itemsWithLinks'
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
  STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.STOCK),
  CONFIG: buildApiUrl(API_CONFIG.ENDPOINTS.CONFIG),
  ITEMS_WITH_LINKS: buildApiUrl(API_CONFIG.ENDPOINTS.ITEMS_WITH_LINKS)
} as const;