// d:\PRoject\Jukut\Versi UPDATE dan EDIT\order-jukut-online-main\order-jukut-online-main\app\lib\settings.ts

// ==============================================================================
//   PENGATURAN GLOBAL APLIKASI
// ==============================================================================

// 1. MODE PENGEMBANG (DEVELOPER MODE)
//    - true  : Toko dianggap SELALU BUKA (bypass jam operasional & limit order).
//              Halaman '/closed' bisa diakses manual meski statusnya 'off'.
//    - false : Aplikasi berjalan normal sesuai aturan bisnis.
export const DEVELOPER_MODE = false;

// 2. STATUS HALAMAN TUTUP (MAINTENANCE / LIBUR PANJANG)
//    - 'on'  : Halaman /closed AKTIF. Jika jam operasional 00.00, user dilempar ke sini.
//    - 'off' : Halaman /closed NON-AKTIF. Jika user akses manual, dilempar balik ke Home.
export const CLOSED_PAGE_STATUS: 'on' | 'off' = 'on';

// 3. GOOGLE APPS SCRIPT URL
//    URL untuk mengakses Google Apps Script (deploy sebagai web app)
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec';

// 4. CLOUDINARY CONFIGURATION
//    Cloud name untuk upload gambar bukti pembayaran
export const CLOUDINARY_CLOUD_NAME = 'dbqjqi8ke';


//Release Version 1.0.0 - 2026-04-12 by Jukut Team , Ardanu Zidan Nur Rofiq a.k.a. Arzie 
