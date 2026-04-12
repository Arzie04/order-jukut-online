/**
 * Menghitung checksum CRC16-CCITT untuk string QRIS.
 * Ini adalah bagian wajib dari standar QRIS.
 * @param str String data QRIS (tanpa CRC di akhir).
 * @returns Checksum 4-digit dalam format heksadesimal uppercase.
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
 * Membuat string QRIS dinamis yang valid dengan nominal tertentu.
 * @param amount Nominal transaksi dalam bentuk angka (contoh: 50000).
 * @returns String QRIS lengkap yang siap di-render menjadi QR code.
 */
export function generateDynamicQris(amount: number): string {
  try {
    // --- PENTING: Ganti dengan template QRIS statis Anda ---
    // Template ini adalah QRIS dari merchant Anda yang sudah valid,
    // namun tanpa tag nominal (tag 54) dan dengan 4 karakter CRC di akhir dihapus.
    // Contoh: '00020101021126...6304' (tanpa 4 digit CRC di ujung)
    const qrisTemplate = '00020101021126690021ID.CO.BANKMANDIRI.WWW01189360000801882204890211718822048960303UMI51440014ID.CO.QRIS.WWW0215ID10254276834590303UMI5204549953033605802ID5923AYAM JUKUT CABE IJO JKT6015Semarang (Kota)61055022962070703A01';

    // 1. Buat tag 54 untuk nominal
    const amountStr = amount.toString();
    const tag54 = '54' + amountStr.length.toString().padStart(2, '0') + amountStr;

    // 2. Sisipkan tag nominal sebelum tag 58 (kode negara)
    let qris = qrisTemplate.replace('5802ID', tag54 + '5802ID');

    // 3. Tambahkan placeholder untuk CRC (tag 63)
    qris += '6304';

    // 4. Hitung CRC baru dari keseluruhan string
    const crc = calculateCrc16(qris);

    // 5. Gabungkan string QRIS dengan CRC yang sudah dihitung
    return qris + crc;

  } catch (error) {
    console.error('Error generating dynamic QRIS:', error);
    return '';
  }
}

// --- Contoh Penggunaan ---
// const nominalBelanja = 75000;
// const kodeQrisDinamis = generateDynamicQris(nominalBelanja);
// console.log(kodeQrisDinamis);
//
// Setelah mendapatkan 'kodeQrisDinamis', Anda bisa menggunakan
// library seperti 'qrcode.react' atau sejenisnya untuk menampilkannya sebagai gambar QR.
