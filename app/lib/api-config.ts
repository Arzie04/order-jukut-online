/**
 * Centralized API configuration for Google Apps Script endpoints
 * Now using Next.js API proxy to avoid CORS issues
 */

const DEFAULT_GOOGLE_FORM_PREFILLED_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/viewform?usp=pp_url&entry.1756210992=NAMA+DISINI&entry.794602475=PESANAN+DISINI&entry.1229878423=NOTE+DISINI&entry.39066530=TOTAL+PEMBAYARAN+DISINI&entry.137521316=NO+ORDER+DISINI';

interface ParsedGoogleFormConfig {
  formUrl: string;
  fields: {
    NAMA: string;
    PESANAN: string;
    NOTE: string;
    TOTAL: string;
    NO_ORDER: string;
  };
}

function getEnvValue(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return '';
}

function parseGoogleFormConfig(prefilledUrl: string): ParsedGoogleFormConfig {
  const parsedUrl = new URL(prefilledUrl);
  const formUrl = `${parsedUrl.origin}${parsedUrl.pathname.replace('/viewform', '/formResponse')}`;
  const fields: ParsedGoogleFormConfig['fields'] = {
    NAMA: '',
    PESANAN: '',
    NOTE: '',
    TOTAL: '',
    NO_ORDER: '',
  };

  for (const [key, value] of parsedUrl.searchParams.entries()) {
    if (!key.startsWith('entry.')) {
      continue;
    }

    const normalizedValue = value.toUpperCase();

    if (normalizedValue.includes('NAMA')) {
      fields.NAMA = key;
    } else if (normalizedValue.includes('PESANAN')) {
      fields.PESANAN = key;
    } else if (normalizedValue.includes('NOTE')) {
      fields.NOTE = key;
    } else if (normalizedValue.includes('TOTAL')) {
      fields.TOTAL = key;
    } else if (normalizedValue.includes('NO ORDER')) {
      fields.NO_ORDER = key;
    }
  }

  return { formUrl, fields };
}

const DEFAULT_GOOGLE_FORM_CONFIG = parseGoogleFormConfig(DEFAULT_GOOGLE_FORM_PREFILLED_URL);

// Google Apps Script URL - now using environment variable
export const GOOGLE_APPS_SCRIPT_URL = getEnvValue('APPS_SCRIPT_URL', 'NEXT_PUBLIC_APPS_SCRIPT_URL') ||
  'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

// Google Form URL untuk order submission
// Format: https://docs.google.com/forms/d/{FORM_ID}/formResponse
export const GOOGLE_FORM_URL =
  getEnvValue('GOOGLE_FORM_URL', 'NEXT_PUBLIC_GOOGLE_FORM_URL') ||
  DEFAULT_GOOGLE_FORM_CONFIG.formUrl;

// Google Form field entry IDs - these map to actual form fields
export const GOOGLE_FORM_FIELDS = {
  NAMA: getEnvValue('FORM_FIELD_NAMA', 'NEXT_PUBLIC_FORM_FIELD_NAMA') || DEFAULT_GOOGLE_FORM_CONFIG.fields.NAMA, // Customer name
  PESANAN: getEnvValue('FORM_FIELD_PESANAN', 'NEXT_PUBLIC_FORM_FIELD_PESANAN') || DEFAULT_GOOGLE_FORM_CONFIG.fields.PESANAN, // Order details
  NOTE: getEnvValue('FORM_FIELD_NOTE', 'NEXT_PUBLIC_FORM_FIELD_NOTE') || DEFAULT_GOOGLE_FORM_CONFIG.fields.NOTE, // Notes
  TOTAL: getEnvValue('FORM_FIELD_TOTAL', 'NEXT_PUBLIC_FORM_FIELD_TOTAL') || DEFAULT_GOOGLE_FORM_CONFIG.fields.TOTAL, // Total amount
  NO_ORDER: getEnvValue('FORM_FIELD_NO_ORDER', 'NEXT_PUBLIC_FORM_FIELD_NO_ORDER') || DEFAULT_GOOGLE_FORM_CONFIG.fields.NO_ORDER // Order number
};

// Proxy endpoints - frontend calls these instead of Google Apps Script directly
export const API_CONFIG = {
  BASE_URL: '/api/proxy', // Use Next.js proxy instead of Google Apps Script directly
  
  // API endpoints
  ENDPOINTS: {
    ORDERS: 'config?api=orders',
    ORDER_ITEM_COUNT: 'config?api=orderItemCount',
    STOCK: 'stock',
    CONFIG: 'config?api=config',
    GET_NEXT_ORDER_ID: 'config?api=getNextOrderId', // SC-A5: Get next order ID
    ITEMS_WITH_LINKS: 'config?api=itemsWithLinks',
    UPDATE_STOCK: 'stock',
    UPDATE_STATUS: 'config?api=updateStatus',
    SUBMIT_GOOGLE_FORM: 'google-form'
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
  GET_NEXT_ORDER_ID: buildApiUrl(API_CONFIG.ENDPOINTS.GET_NEXT_ORDER_ID),
  ITEMS_WITH_LINKS: buildApiUrl(API_CONFIG.ENDPOINTS.ITEMS_WITH_LINKS),
  UPDATE_STOCK: buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_STOCK),
  UPDATE_STATUS: buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_STATUS),
  SUBMIT_GOOGLE_FORM: buildApiUrl(API_CONFIG.ENDPOINTS.SUBMIT_GOOGLE_FORM)
} as const;
