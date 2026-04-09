/**
 * Centralized API configuration for Google Apps Script endpoints
 * Now using Next.js API proxy to avoid CORS issues
 */

// Direct Google Apps Script URL (for reference, not used in frontend)
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

// Proxy endpoints - frontend calls these instead of Google Apps Script directly
export const API_CONFIG = {
  BASE_URL: '/api/proxy', // Use Next.js proxy instead of Google Apps Script directly
  
  // API endpoints
  ENDPOINTS: {
    ORDERS: 'config?api=orders',
    ORDER_ITEM_COUNT: 'config?api=orderItemCount',
    STOCK: 'stock',
    CONFIG: 'config?api=config',
    ITEMS_WITH_LINKS: 'config?api=itemsWithLinks',
    UPDATE_STOCK: 'stock',
    UPDATE_STATUS: 'config?api=updateStatus'
  },
  
  // Request configuration
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000 // 1 second base delay
} as const;

/**
 * Helper function to build API URLs
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}/${endpoint}`;
}

/**
 * Predefined API URLs for common endpoints
 */
export const API_URLS = {
  ORDERS: buildApiUrl(API_CONFIG.ENDPOINTS.ORDERS),
  ORDER_ITEM_COUNT: buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_ITEM_COUNT),
  STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.STOCK),
  CONFIG: buildApiUrl(API_CONFIG.ENDPOINTS.CONFIG),
  ITEMS_WITH_LINKS: buildApiUrl(API_CONFIG.ENDPOINTS.ITEMS_WITH_LINKS),
  UPDATE_STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_STOCK),
  UPDATE_STATUS: buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_STATUS)
} as const;