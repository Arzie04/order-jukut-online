# Panduan Template Web Order Online

Dokumen ini adalah panduan utama untuk memakai repo ini sebagai template usaha lain. Fokusnya bukan hanya cara menjalankan project, tapi juga bagian mana saja yang wajib di-custom, file mana yang perlu disentuh, dan konsekuensi tiap perubahan.

## 1. Gambaran Sistem

Stack aplikasi:

- Frontend: Next.js App Router + React + TypeScript + Tailwind
- Backend: Google Apps Script
- Database: Google Sheets
- Payment proof: Cloudinary
- OCR bukti transfer/QRIS: Tesseract.js
- Channel follow-up: WhatsApp deep link

Alur utama:

1. User pilih menu dan isi nama.
2. Frontend hitung total dan bentuk string pesanan.
3. Frontend kirim order ke Next.js API route.
4. Next.js API route meneruskan request ke Google Apps Script.
5. Apps Script simpan pesanan ke Google Sheet.
6. Frontend tampilkan QRIS dan minta upload bukti pembayaran.
7. Bukti diverifikasi di frontend, diupload ke Cloudinary, lalu dikonfirmasi ke Apps Script.
8. User lanjut kirim pesan final ke WhatsApp admin.

## 2. Struktur File Penting

File yang paling penting untuk template ini:

- `app/page.tsx`
  Tempat state utama order, perhitungan total, validasi stok, format string pesanan, dan submit order.
- `app/components/OrderButtonGrid.tsx`
  Tempat daftar menu yang tampil di UI dan mapping gambar produk.
- `app/components/CurrentOrder.tsx`
  Tempat tampilan cart dan logika UI pecah varian paket seperti `SB`.
- `app/lib/settings.ts`
  Tempat mode developer, status halaman tutup, Apps Script URL, dan Cloudinary cloud name.
- `app/lib/api-config.ts`
  Tempat konfigurasi endpoint proxy dan fallback konfigurasi Google Form.
- `app/lib/payment-verification.ts`
  Tempat OCR bukti pembayaran, validasi nominal, dan upload ke Cloudinary.
- `app/lib/qris-generator.ts`
  Tempat template QRIS dinamis dan identitas merchant QRIS.
- `app/api/proxy/config/route.ts`
  Proxy GET ke Apps Script untuk `orders`, `config`, `getNextOrderId`, dan endpoint GET lain.
- `app/api/proxy/stock/route.ts`
  Proxy GET stok.
- `app/api/proxy/insert-order/route.ts`
  Proxy POST insert order.
- `app/api/proxy/payment/route.ts`
  Proxy POST konfirmasi pembayaran.
- `spreadsheet-script.gs`
  Backend utama di Google Apps Script.

## 3. Bagian yang Wajib Di-custom untuk Usaha Lain

Kalau repo ini dipakai ulang untuk bisnis lain, bagian di bawah hampir pasti wajib diubah.

### 3.1 Identitas usaha

Ubah:

- Nama outlet/brand di heading, modal, halaman tutup, dan QRIS merchant label
- Nomor WhatsApp admin
- Nama merchant di pesan WhatsApp
- Teks tutorial dan catatan penting

File yang perlu dicek:

- `app/components/OrderingPage.tsx`
- `app/components/TutorialModal.tsx`
- `app/components/AlertModal.tsx`
- `app/components/ConfirmationModal.tsx`
- `app/closed/page.tsx`
- `app/lib/qris-generator.ts`
- `app/page.tsx`

### 3.2 Menu, kode item, kategori, dan gambar

Sumber utama menu saat ini ada di:

- `app/components/OrderButtonGrid.tsx`
  Di sini kategori dan kode item didefinisikan di object `menuItems`.
- `app/page.tsx`
  Di sini harga item didefinisikan di `priceMap`.
- `app/components/CurrentOrder.tsx`
  Di sini label tampilan item didefinisikan di `ITEM_NAMES`.

Kalau menambah atau mengubah item, biasanya kamu perlu update tiga tempat sekaligus:

1. `menuItems`
2. `priceMap`
3. `ITEM_NAMES`

Kalau item baru mempengaruhi stok, kamu juga perlu cek:

- `itemCodeToNameMap` di `app/page.tsx`
- `getConsumedStockNames()` di `app/page.tsx`

Contoh kasus:

- Tambah menu baru `NP BR`:
  harus masuk ke grid menu, harga, nama tampilan, dan mapping stok bila item itu mengurangi stok bahan tertentu.
- Tambah varian paket:
  harus dipikirkan format `code`-nya, cara tampil di cart, dan cara dihitung di stok.

### 3.3 Harga

Harga item sekarang dikelola di `app/page.tsx` melalui object `priceMap`.

Aturan penting:

- Key harga harus sama dengan code item.
- Jika ada varian cart seperti `PKT PA SB`, sistem fallback ke harga `PKT PA`.
- Kalau struktur code diubah total, helper parsing di `app/page.tsx` harus ikut diubah.

### 3.4 Logika stok

Logika stok frontend ada di `app/page.tsx`.

Yang perlu dipahami:

- Bukan semua item mengurangi stok yang sama.
- Paket mengurangi beberapa komponen sekaligus.
- Paket default dan paket `SB` bisa mengurangi stok sambal yang berbeda.

Fungsi penting:

- `itemCodeToNameMap`
- `getConsumedStockNames()`
- `getOrderQuantities()`

Kalau bisnis lain punya struktur bahan berbeda, bagian ini wajib disesuaikan.

Contoh:

- Paket default mengurangi `NASI PUTIH`, `JUKUT`, `SAMBAL IJO`
- Paket `SB` mengurangi `NASI PUTIH`, `JUKUT`, `SAMBAL BAWANG`

Kalau bisnis baru tidak pakai stok per bahan, kamu bisa sederhanakan logika ini supaya hanya mengurangi stok item utama.

### 3.5 Jam operasional dan mode tutup

Ada dua layer:

1. `app/lib/settings.ts`
   Untuk mode developer dan status halaman `/closed`
2. Google Sheet config
   Untuk jam buka, jam tutup, dan max order

Pengaturan penting:

- `DEVELOPER_MODE`
- `CLOSED_PAGE_STATUS`

Perilaku:

- Jika `DEVELOPER_MODE = true`, web dianggap selalu buka.
- Jika `CLOSED_PAGE_STATUS = 'on'` dan jam buka/tutup di sheet adalah `00.00`, user diarahkan ke halaman `/closed`.

### 3.6 QRIS

QRIS dinamis dibentuk di `app/lib/qris-generator.ts`.

Bagian yang perlu dicek jika dipakai bisnis lain:

- Template QRIS statis
- Nama merchant
- Kota merchant
- Validitas QR merchant string

Kalau QRIS merchant berubah, jangan cuma ganti gambar. Yang perlu diubah justru string template QRIS di file generator.

### 3.7 Bukti pembayaran dan OCR

Logika bukti pembayaran ada di `app/lib/payment-verification.ts`.

Yang perlu di-custom jika rekening, merchant, atau pola bukti berubah:

- Keyword validasi
- Identifier outlet
- Toleransi nominal
- Strategi ekstraksi nominal
- Upload preset Cloudinary

Kalau usaha lain tidak butuh OCR otomatis, modul ini bisa disederhanakan jadi upload bukti manual saja.

### 3.8 Google Apps Script dan Google Sheet

`spreadsheet-script.gs` adalah backend utama.

Yang wajib sesuai:

- Nama sheet order
- Nama sheet stok
- Struktur kolom
- Endpoint GET/POST yang dipanggil frontend

Struktur order sheet saat ini:

- Column A: waktu
- Column B: nama
- Column C: pesanan
- Column D: note
- Column E: total
- Column F: no_order
- Column G: paid
- Column H: kosong/reserved
- Column I: status
- Column J: bukti pembayaran

Struktur stock sheet saat ini:

- Column A: id_item
- Column B: nama_item
- Column C: stok
- Column D: status
- Column E: catatan

Kalau nama sheet atau urutan kolom berubah, Apps Script harus diubah juga.

## 4. Format Pesanan yang Dipakai Sistem

Order tidak disimpan sebagai JSON terstruktur di database. Sistem saat ini menyimpan detail order sebagai string multi-baris di kolom `pesanan`.

Contoh:

```txt
PKT PA 2
PKT PA SB 1
EXT TP 2
```

Maknanya:

- `PKT PA 2` = paket paha atas default sebanyak 2
- `PKT PA SB 1` = paket paha atas sambal bawang sebanyak 1
- `EXT TP 2` = tempe tambahan sebanyak 2

Kalau mau mengubah format kode, kamu harus cek:

- frontend formatter di `app/page.tsx`
- parser cart di `app/components/CurrentOrder.tsx`
- parser Apps Script di `spreadsheet-script.gs`

## 5. Environment Variables

Template env dasar ada di `.env.example`.

Yang paling penting:

- `APPS_SCRIPT_URL`
- `GOOGLE_FORM_URL`
- `FORM_FIELD_NAMA`
- `FORM_FIELD_PESANAN`
- `FORM_FIELD_NOTE`
- `FORM_FIELD_TOTAL`
- `FORM_FIELD_NO_ORDER`

Catatan:

- Flow utama sekarang sudah mengandalkan Apps Script insert order.
- Endpoint Google Form masih ada sebagai fallback/legacy compatibility.
- Untuk deployment baru, pastikan env yang aktif sinkron dengan `app/lib/settings.ts` dan `app/lib/api-config.ts`.

## 6. Sistem Logging Developer

Template ini sekarang memakai pola logging berbasis `DEVELOPER_MODE`.

File utama:

- `app/lib/settings.ts`
- `app/lib/logger.ts`
- `app/components/ConsoleGate.tsx`

Aturannya:

- Jika `DEVELOPER_MODE = false`
  log browser dari aplikasi dibungkam, dan log developer helper tidak tampil.
- Jika `DEVELOPER_MODE = true`
  log penting untuk debugging tampil.

Helper yang dipakai:

- `devLog(...)`
  untuk jejak proses normal, debug flow, payload ringkas, hasil retry, hasil parsing
- `devWarn(...)`
  untuk warning non-fatal, fallback, atau kondisi yang masih bisa dilanjutkan
- `devError(...)`
  untuk error developer-facing yang ingin terlihat saat mode dev aktif

Contoh penggunaan yang disarankan:

- `devLog('Creating order...', payloadSummary)`
- `devWarn('Using stale cache fallback')`
- `devError('Payment confirmation failed', error)`

Fungsi log penting yang sebaiknya dipertahankan saat mode dev:

- log create order dan response nomor order
- log retry fetch config/stock
- log payment verification result
- log payment confirmation request/response
- log Apps Script proxy error

Catatan penting:

- `ConsoleGate` adalah safety net untuk browser agar sisa `console.*` lama tidak muncul saat `DEVELOPER_MODE = false`.
- Standar penulisan ke depan tetap memakai `devLog`, `devWarn`, dan `devError`, bukan menambah `console.log` baru langsung.
- Logging ini hanya mengontrol kode Next.js/frontend/backend repo ini.
- Log di `spreadsheet-script.gs` adalah environment Google Apps Script terpisah, jadi tidak otomatis ikut tunduk ke `DEVELOPER_MODE` dari frontend.

## 7. Google Apps Script yang Wajib Dipahami

Fungsi penting:

- `doGet(e)`
  Menangani endpoint GET seperti `orders`, `stock`, `config`, `getNextOrderId`
- `doPost(e)`
  Menangani insert order, konfirmasi pembayaran, dan update stok
- `reserveNextOrderId(sheet)`
  Membuat nomor order global yang terus naik
- `insertNewOrder(body)`
  Menyimpan order baru ke sheet
- `getOrderItemCount()`
  Menghitung total item harian dari kolom `pesanan`

Kalau kamu mengubah format order string, fungsi `getOrderItemCount()` dan logika parsing lain wajib ikut dicek.

## 8. Checklist Custom untuk Pakai di Usaha Lain

Pakai checklist ini sebelum launch:

1. Ganti semua nama brand, merchant, dan teks usaha.
2. Ganti daftar menu di `OrderButtonGrid.tsx`.
3. Ganti harga di `app/page.tsx`.
4. Ganti label tampilan item di `CurrentOrder.tsx`.
5. Ganti mapping stok di `app/page.tsx`.
6. Ganti QRIS template di `qris-generator.ts`.
7. Ganti Cloudinary config dan upload preset.
8. Ganti WhatsApp admin dan format pesan.
9. Ganti Apps Script URL.
10. Sesuaikan nama sheet dan struktur kolom di Google Sheet.
11. Deploy ulang Apps Script sebagai web app.
12. Tes alur end-to-end:
    buat order, cek nomor order, cek order masuk sheet, cek stok berkurang, cek upload bukti, cek pesan WhatsApp.

## 9. Checklist Testing Setelah Custom

Minimal test berikut:

### Test order

- Buat order 1 item biasa
- Buat order paket
- Buat order paket dengan varian `SB`
- Buat order dengan item tambahan
- Cek total sesuai

### Test stok

- Cek item gagal dipesan saat stok bahan habis
- Cek paket default mengurangi `SAMBAL IJO`
- Cek paket `SB` mengurangi `SAMBAL BAWANG`

### Test backend

- Cek order masuk ke Google Sheet
- Cek nomor order terus naik
- Cek endpoint stock, config, orders bisa dibaca

### Test payment

- Upload bukti valid
- Upload bukti tidak valid
- Cek URL bukti pembayaran tersimpan

### Test UX

- Mobile layout
- Desktop layout
- Redirect halaman tutup
- Recovery dari localStorage setelah refresh

## 10. File yang Boleh Diabaikan Saat Custom Awal

Kalau hanya ingin cloning cepat untuk usaha lain, kamu tidak harus langsung menyentuh semua file ini:

- `API_TESTER.html`
- `API_URLS.html`
- `serve.js`
- dokumentasi lama lain di root

File-file itu lebih cocok untuk troubleshooting dan dokumentasi internal.

## 11. Rekomendasi Cara Kerja Saat Clone Template

Urutan yang paling aman:

1. Custom brand dan aset visual.
2. Custom menu, harga, dan stok.
3. Custom Google Sheet + Apps Script.
4. Custom QRIS dan Cloudinary.
5. Test lokal.
6. Deploy.
7. Test transaksi nyata end-to-end.

Kalau langkah ini diikuti, risiko “UI sudah berubah tapi backend belum sinkron” akan jauh lebih kecil.
