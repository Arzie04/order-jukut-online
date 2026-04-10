import { createWorker } from 'tesseract.js';
import { APPS_SCRIPT_URL, CLOUDINARY_CLOUD_NAME } from './settings';

export interface PaymentVerificationResult {
  isValid: boolean;
  cloudinaryUrl: string;
  extractedText: string;
  confidence: number;
}

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ayam_jukut_preset');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload to Cloudinary failed');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Extract text from image using Tesseract.js
 * Can work with URLs or File objects
 */
export async function extractTextFromImage(imageSource: string | File): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('ind', 1, {
    logger: m => console.log(m)
  });

  try {
    // If it's a File object, convert to Data URL for local processing
    let source: string | File = imageSource;
    if (imageSource instanceof File) {
      source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(imageSource);
      });
    }

    const { data: { text, confidence } } = await worker.recognize(source);
    return { text, confidence };
  } finally {
    await worker.terminate();
  }
}

/**
 * Normalize text for QRIS amount extraction
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/rp\s*/g, 'rp');
}

/**
 * Parse amount from string by removing non-digits
 */
/**
 * Parse amount string handling multiple formats
 * - "16.000,00" (Indonesian with decimals: . = thousands, , = decimal) → 16000
 * - "12.000" (Wonder: . = thousands, no decimals) → 12000
 * - "16,000.00" (US: , = thousands, . = decimal) → 16000
 * - "16000" (plain) → 16000
 */
function parseAmount(raw: string): number {
  if (!raw) return 0;
  
  // Detect format by comma presence (comma indicates decimal separator = Indonesian/EU style)
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  
  let normalized = raw;
  
  if (hasComma && hasDot) {
    // Format: 16.000,00 or 16.000,0 (comma is decimal sep, dot is thousands sep - Indonesian)
    // Remove dots, keep comma, then split to remove decimals
    normalized = raw.replace(/\./g, '').split(',')[0];
  } else if (hasComma && !hasDot) {
    // Format: 16,000.00 (US style, comma is thousands sep)
    // This shouldn't happen in Indonesian context, but handle it
    normalized = raw.replace(/,/g, '').split('.')[0];
  } else if (hasDot && !hasComma) {
    // Format: 12.000 or 12,000.00 → need to determine if dot is thousands or decimal
    // In Indonesian context (Rp prefix), dot is always thousands separator
    // In US context, dot is always decimal separator
    // Rule: if it looks like "XX.XXX" (dot divides into 2 or 3 digits on right), it's thousands sep
    const parts = raw.split('.');
    if (parts[parts.length - 1].length === 3) {
      // Format: 12.000 (dot is thousands separator - Indonesian)
      normalized = raw.replace(/\./g, '');
    } else {
      // Format: 12.50 (dot is decimal separator)
      normalized = raw.split('.')[0];
    }
  }
  // else: plain number, no separators
  
  // Extract only digits
  const result = parseInt(normalized.replace(/\D/g, ''), 10);
  return isNaN(result) ? 0 : result;
}

/**
 * Validate if amount is in reasonable range for food prices
 */
function isValidAmount(amount: number): boolean {
  if (!amount) return false;
  
  // Range masuk akal untuk makanan (1000 - 500000)
  if (amount < 1000 || amount > 500000) return false;
  
  // Buang angka aneh (kayak ref ID atau nomor panjang)
  if (amount.toString().length > 6) return false;
  
  return true;
}

/**
 * Extract amount by looking for keywords (TOTAL, NOMINAL, etc)
 */
function extractAmountByLabel(text: string): number | null {
  // More flexible patterns that handle various formats
  const patterns = [
    // "Total Nominal" patterns (Bima Bank format)
    /total\s+nominal\s*:?\s*idr?\.?\s*([\d.,]+)/i,
    
    // "Nominal" patterns
    /nominal\s*:?\s*idr?\.?\s*([\d.,]+)/i,
    /nominal\s*:?\s*rp?\.?\s*([\d.,]+)/i,
    /nominal\s*rp([\d.,]+)/i,
    /nominal\s+([\d.,]+)/i,
    
    // "Pembayaran" patterns (Bima Bank: "Pembayaran QR")
    /pembayaran\s*(?:qr|qt|q\.r)?:?\s*idr?\.?\s*([\d.,]+)/i,
    /pembayaran\s*(?:qr|qt|q\.r)?:?\s*rp?\.?\s*([\d.,]+)/i,
    
    // "Total" patterns
    /total\s*:?\s*idr?\.?\s*([\d.,]+)/i,
    /total\s*:?\s*rp?\.?\s*([\d.,]+)/i,
    /total\s+rp([\d.,]+)/i,
    /total\s+([\d.,]+)/i,
    
    // Direct "IDR" patterns (Bima: "IDR 16.000,00")
    /idr\s*\.?\s*([\d.,]+)/i,
    /idr([\d.,]{4,})/i,
    
    // Direct "Rp" patterns
    /rp\s*\.?\s*([\d.,]+)/i,
    /rp([\d.,]{4,})/i,
    
    // Just amount patterns (fallback)
    /([\d]{2,3}\.[\d]{3}(?:,[\d]{2})?)/i // matches like 12.000 or 12.000,00
  ];

  console.log('  Trying label-based extraction with multiple patterns...');
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1];
      console.log(`    Pattern match: ${pattern} → "${raw}"`);
      const amount = parseAmount(raw);
      if (isValidAmount(amount)) {
        console.log(`    ✅ Valid amount found: ${amount}`);
        return amount;
      }
    }
  }

  return null;
}

/**
 * Extract amount by finding largest valid candidate
 * IMPROVED: Uses updated parseAmount that handles formatted numbers correctly
 */
function extractByCandidates(text: string): number | null {
  console.log('    Fallback: searching for amount candidates...');
  
  // Match various patterns with proper formatting support
  const patterns = [
    /idr\s*\.?\s*([\d.,]+)/gi,      // IDR12.000 atau IDR 12.000 (Bima Bank)
    /rp\s*\.?\s*([\d.,]+)/gi,       // Rp12.000 atau Rp 12.000
    /([\d]{1,3}(?:\.[\d]{3})+(?:,[\d]{2})?)/gi, // 12.000 atau 12.000,00
  ];

  const candidates = new Set<number>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1] || match[0];
      const amount = parseAmount(raw);
      console.log(`      Candidate: "${raw}" → ${amount}`);
      
      if (isValidAmount(amount)) {
        candidates.add(amount);
        console.log(`        ✅ Valid: ${amount}`);
      }
    }
  }

  if (candidates.size === 0) {
    console.log('    ⚠️ No valid candidates found');
    return null;
  }

  const amounts = Array.from(candidates).sort((a, b) => b - a);
  console.log(`  ⚠️ Fallback: found ${amounts.length} candidates: ${amounts.join(', ')}`);
  
  const largest = amounts[0];
  console.log(`  ⚠️ Using largest: ${largest}`);
  return largest;
}

/**
 * Extract QRIS amount from OCR text using smart pattern matching
 * Strategy: 1) Label-based (TOTAL, NOMINAL) 2) Fallback to largest valid amount
 */
export function extractQRISAmount(ocrText: string): number | null {
  console.log('🔍 === EXTRACTING QRIS AMOUNT ===');
  console.log('Raw OCR text:');
  console.log(JSON.stringify(ocrText));
  console.log('Text length:', ocrText.length);
  console.log('');
  
  const text = normalize(ocrText);
  console.log('Normalized text:');
  console.log(JSON.stringify(text));
  console.log('');

  // 1. PRIORITAS: label-based extraction
  console.log('Step 1: Label-based extraction...');
  const labeled = extractAmountByLabel(text);
  if (labeled !== null) {
    console.log(`✅ FOUND via label: ${labeled}`);
    console.log('🔍 === EXTRACTION END ===\n');
    return labeled;
  }
  console.log('  Label-based extraction failed, trying fallback...\n');

  // 2. FALLBACK: candidate terbesar
  console.log('Step 2: Fallback extraction (largest candidate)...');
  const fallback = extractByCandidates(text);
  if (fallback !== null) {
    console.log(`✅ FOUND via fallback: ${fallback}`);
    console.log('🔍 === EXTRACTION END ===\n');
    return fallback;
  }
  
  console.warn('❌ Could not extract any valid amount');
  console.log('🔍 === EXTRACTION END ===\n');
  return null;
}

/**
 * Validate payment from extracted text using smart QRIS parser
 */
export function validatePayment(text: string, expectedAmount: number): boolean {
  console.log('\n=== PAYMENT VALIDATION START ===');
  console.log('Expected amount:', expectedAmount);
  console.log('');

  const lowerText = text.toLowerCase();

  // Check 1: Verify outlet identifier (support both Semarang and other outlets)
  console.log('Check 1: Outlet identifier...');
  const outletKeywords = [
    'ayam jukut cabe ijo',     // Full name
    'ayam jukut',              // Partial
    'cabe ijo',                // Partial
    'jkt',                     // Abbreviation
    'jkut',                    // Alternative spelling
    'jukut cabe',              // Reverse order
    'semarang',                // City (Bima: Semarang Kota)
    'semarang kota',           // City + subregion
  ];
  const hasOutletMatch = outletKeywords.some(keyword => lowerText.includes(keyword));
  
  if (!hasOutletMatch) {
    console.warn('❌ FAILED: Outlet identifier not found');
    console.warn('  Required one of:', outletKeywords.join(', '));
    console.log('=== PAYMENT VALIDATION END (FAILED) ===\n');
    return false;
  }
  console.log('✅ Outlet identifier found\n');

  // Check 2: Success keywords + Bank info (Bima shows "berhasil", "status transaksi" header, etc)
  console.log('Check 2: Success/Completion keywords...');
  const successKeywords = [
    'berhasil',              // Bima Bank: "Status transaksi Berhasil"
    'success',               // English
    'lunas',                 // Fully paid
    'paid',                  // English
    'kamu membayar',         // User paid
    'pembayaran',            // Payment
    'status transaksi',      // Bima Bank header
    'transaksi',             // Transaction (Bima Bank format)
  ];
  const foundKeywords = successKeywords.filter(kw => lowerText.includes(kw));
  const hasSuccess = foundKeywords.length > 0;

  console.log('Success keywords to check:', successKeywords.join(', '));
  console.log('Found keywords:', foundKeywords.length > 0 ? foundKeywords.join(', ') : 'NONE');
  console.log('');

  if (!hasSuccess) {
    console.warn('❌ FAILED: No success keyword found');
    console.log('=== PAYMENT VALIDATION END (FAILED) ===\n');
    return false;
  }

  console.log('✅ Success keyword found\n');

  // Check 3: Amount validation
  console.log('Check 3: Amount validation...');
  console.log('Extracting amount from OCR text...');
  const extractedAmount = extractQRISAmount(text);
  
  if (extractedAmount === null) {
    console.warn('❌ FAILED: Could not extract any valid amount from OCR');
    console.log('=== PAYMENT VALIDATION END (FAILED) ===\n');
    return false;
  }

  console.log(`✅ Amount extracted: ${extractedAmount}\n`);

  // Compare extracted amount with expected
  const difference = Math.abs(extractedAmount - expectedAmount);
  const percentDiff = (difference / expectedAmount) * 100;

  console.log('Amount Comparison:');
  console.log(`  Expected: ${expectedAmount}`);
  console.log(`  Extracted: ${extractedAmount}`);
  console.log(`  Difference: ${difference} (${percentDiff.toFixed(1)}%)`);
  console.log('');

  // Accept if exact match or within tiny tolerance (50 rupiah for rounding)
  if (difference === 0) {
    console.log(`✅ EXACT MATCH!`);
    console.log('=== PAYMENT VALIDATION END (SUCCESS) ===\n');
    return true;
  }
  
  if (difference <= 50) {
    console.log(`✅ MATCH (within 50 rupiah rounding tolerance)`);
    console.log('=== PAYMENT VALIDATION END (SUCCESS) ===\n');
    return true;
  }

  console.warn(`❌ FAILED: Amount mismatch exceeds tolerance`);
  console.warn(`  Expected: ${expectedAmount}, Got: ${extractedAmount}, Diff: ${difference}`);
  console.log('=== PAYMENT VALIDATION END (FAILED) ===\n');
  return false;
}

/**
 * Complete payment verification process
 * Only uploads to Cloudinary if payment is valid
 */
export async function verifyPayment(file: File, expectedAmount: number): Promise<PaymentVerificationResult> {
  try {
    console.log('🔍 Starting payment verification...');
    console.log('File:', file.name, file.size, 'bytes');
    console.log('Expected amount:', expectedAmount);

    // Step 1: Extract text from local file WITHOUT uploading to Cloudinary yet
    console.log('🔤 Extracting text with OCR (local processing)...');
    const { text, confidence } = await extractTextFromImage(file);
    console.log('📝 Extracted text:', text);
    console.log('📊 OCR Confidence:', confidence);

    // Step 2: Validate payment
    console.log('✔️ Validating payment...');
    const isValid = validatePayment(text, expectedAmount);
    console.log('Validation result:', isValid ? '✅ VALID' : '❌ INVALID');

    // Step 3: Only upload to Cloudinary if payment is valid
    let cloudinaryUrl = '';
    if (isValid) {
      console.log('📤 Payment valid! Uploading to Cloudinary...');
      cloudinaryUrl = await uploadToCloudinary(file);
      console.log('✅ Cloudinary URL:', cloudinaryUrl);
    } else {
      console.log('⏭️ Payment invalid - skipping Cloudinary upload to save storage');
    }

    return {
      isValid,
      cloudinaryUrl,
      extractedText: text,
      confidence
    };
  } catch (error) {
    console.error('❌ Payment verification failed:', error);
    throw error;
  }
}

/**
 * Check network connectivity
 */
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a simple endpoint to check connectivity
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
}

/**
 * Send payment confirmation to Google Apps Script with enhanced retry mechanism
 */
export async function confirmPayment(noOrder: string, cloudinaryUrl: string, statusPaid: boolean): Promise<void> {
  console.log('💾 Sending payment confirmation:', { noOrder, cloudinaryUrl, statusPaid });
  
  // VALIDATION: Check if noOrder is valid before sending
  if (!noOrder || String(noOrder).trim() === '') {
    console.error('❌ CRITICAL: Cannot confirm payment - noOrder is empty or invalid');
    console.error('   noOrder:', noOrder);
    throw new Error('Nomor pesanan tidak valid atau kosong. Tidak dapat mengkonfirmasi pembayaran.');
  }
  
  // First check network connectivity
  const isOnline = await checkNetworkConnectivity();
  if (!isOnline) {
    throw new Error('Tidak ada koneksi internet. Silakan periksa koneksi Anda dan coba lagi.');
  }
  
  const maxRetries = 5; // Increased retries
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Payment confirmation attempt ${attempt}/${maxRetries} for order: ${noOrder}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased timeout to 45 seconds
      
      const response = await fetch('/api/proxy/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          type: 'CONFIRM_PAYMENT',
          no_order: noOrder,
          cloudinary_url: cloudinaryUrl,
          status_paid: statusPaid
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Payment confirmation result:', result);
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'Payment confirmation failed');
      }
      
      // Success - exit retry loop
      console.log('✅ Payment confirmation successful for order:', noOrder);
      return;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Payment confirmation attempt ${attempt} failed:`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if it's a network error and wait longer
      const isNetworkError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('AbortError') ||
        error.name === 'AbortError'
      );
      
      // Progressive delay with longer waits for network errors
      const baseDelay = isNetworkError ? 2000 : 1000;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = lastError?.message || 'Unknown error';
  console.error('❌ All payment confirmation attempts failed for order:', noOrder);
  console.error('   Error:', errorMessage);
  
  // Provide user-friendly error messages based on error type
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    throw new Error('Koneksi internet bermasalah. Silakan periksa koneksi Anda dan coba lagi.');
  } else if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
    throw new Error('Permintaan timeout. Silakan coba lagi dalam beberapa saat.');
  } else if (errorMessage.includes('CORS')) {
    throw new Error('Terjadi masalah konfigurasi server. Silakan hubungi admin.');
  } else if (errorMessage.includes('HTTP 429')) {
    throw new Error('Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.');
  } else if (errorMessage.includes('HTTP 5')) {
    throw new Error('Server sedang bermasalah. Silakan coba lagi dalam beberapa menit.');
  } else if (errorMessage.includes('tidak ditemukan di database')) {
    throw new Error(`Gagal mengkonfirmasi pembayaran: ${errorMessage}`);
  } else {
    throw new Error(`Gagal mengkonfirmasi pembayaran: ${errorMessage}`);
  }
}