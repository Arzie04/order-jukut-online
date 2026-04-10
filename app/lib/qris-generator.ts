import { devError } from './logger';

/**
 * QRIS Dynamic Generator with Nominal Injection
 * Generate QRIS yang valid dengan nominal dinamis dan CRC yang dihitung ulang
 * Format: EMV QRCPS compliant dengan proper CRC checksum
 * 
 * Referensi: Dari template QRIS Statis, inject nominal di tag 54, recalculate CRC
 */

/**
 * Calculate CRC16-CCITT untuk QRIS
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function calculateCrc16(str: string): string {
  let crc = 0xFFFF;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate QRIS yang valid dengan nominal dinamis
 * Menggunakan approach: ambil template statis, inject nominal, recalculate CRC
 */
export function generateDynamicQris(amount: number): string {
  try {
    // QRIS Template dari static QRIS yang sudah valid
    // Format: 00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801882204890211718822048960303UMI51440014ID.CO.QRIS.WWW0215ID10254276834590303UMI5204549953033605802ID5923AYAM JUKUT CABE IJO JKT6015Semarang (Kota)61055022962070703A016304????
    // Catatan: 54 (nominal) belum ada, 6304 ada placeholder CRC
    
    const qrisTemplate = '00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801882204890211718822048960303UMI51440014ID.CO.QRIS.WWW0215ID10254276834590303UMI5204549953033605802ID5923AYAM JUKUT CABE IJO JKT6015Semarang (Kota)61055022962070703A016304';

    // Hapus CRC lama (4 digit terakhir setelah '6304')
    let qris = qrisTemplate.slice(0, -4);

    // Inject nominal dengan format tag 54
    const amountStr = amount.toString();
    const tag54 = '54' + amountStr.length.toString().padStart(2, '0') + amountStr;

    // Sisipkan sebelum '5802ID'
    qris = qris.replace('5802ID', tag54 + '5802ID');

    // Tambah CRC tag placeholder
    qris += '6304';

    // Hitung CRC dari semua data termasuk '6304'
    const crc = calculateCrc16(qris);

    // Return QRIS lengkap dengan CRC yang benar
    return qris + crc;
  } catch (error) {
    devError('Error generating dynamic QRIS:', error);
    return '';
  }
}

/**
 * Hitung CRC-16/CCITT-FALSE
 * Polynomial: 0x1021, Initial: 0xFFFF
 * Fungsi ini sudah ter-include di calculateCrc16 di atas
 */


/**
 * Generate invoice/reference number unik
 * Format: YYYYMMDDHHMMSS (14 digit)
 */
export function generateInvoiceRef(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate transaction reference dengan random suffix
 */
export function generateTransactionRef(): string {
  const invoice = generateInvoiceRef();
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${invoice}${random}`;
}

/**
 * Format amount untuk display
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('id-ID');
}

/**
 * Generate display info untuk modal
 */
export function generateQrisInfo(amount: number) {
  return {
    qrisCode: generateDynamicQris(amount),
    amount,
    amountFormatted: formatAmount(amount),
    reference: generateTransactionRef(),
    merchant: 'AYAM JUKUT JAKARTA',
    timestamp: new Date().toLocaleString('id-ID'),
  };
}
