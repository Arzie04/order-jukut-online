// d:\PRoject\Jukut\Versi UPDATE dan EDIT\order-jukut-online-main\order-jukut-online-main\app\lib\settings.ts

// ==============================================================================
//   PENGATURAN GLOBAL APLIKASI
// ==============================================================================

// 1. MODE PENGEMBANG (DEVELOPER MODE)
//    - true  : Toko dianggap SELALU BUKA (bypass jam operasional & limit order).
//              Halaman '/closed' bisa diakses manual meski statusnya 'off'.
//    - false : Aplikasi berjalan normal sesuai aturan bisnis.
export const DEVELOPER_MODE = true;

// 2. STATUS HALAMAN TUTUP (MAINTENANCE / LIBUR PANJANG)
//    - 'on'  : Halaman /closed AKTIF. Jika jam operasional 00.00, user dilempar ke sini.
//    - 'off' : Halaman /closed NON-AKTIF. Jika user akses manual, dilempar balik ke Home.
export const CLOSED_PAGE_STATUS: 'on' | 'off' = 'on';
