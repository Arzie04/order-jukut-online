# Referensi Operasional Jukut

Dokumen ini khusus untuk setup Jukut yang sedang dipakai sekarang. Tujuannya sebagai catatan operasional: link, endpoint, env, sheet, dan sumber konfigurasi aktif.

## 1. Identitas Setup Saat Ini

- Project: `order-jukut-online-main`
- Timezone bisnis: WIB
- Mode developer: `false`
- Status halaman tutup: `'on'`

Sumber:

- `app/lib/settings.ts`

## 2. Link dan Integrasi Aktif

### 2.1 Google Apps Script

Apps Script URL aktif:

```text
https://script.google.com/macros/s/AKfycbxe5xK7fOwhC2Z4Z3khcjZ5n0N3e_-qsXwigNPeHXyDtFu2aXZqon3aIdI58Aqkciej/exec
```

Dipakai oleh:

- `app/lib/settings.ts`
- `app/lib/api-config.ts`
- semua proxy route di `app/api/proxy/*`

### 2.2 Google Form

Prefilled URL source:

```text
https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/viewform?usp=pp_url&entry.1756210992=NAMA+DISINI&entry.794602475=PESANAN+DISINI&entry.1229878423=NOTE+DISINI&entry.39066530=TOTAL+PEMBAYARAN+DISINI&entry.137521316=NO+ORDER+DISINI
```

Form response URL:

```text
https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/formResponse
```

Field ID:

- `FORM_FIELD_NAMA=entry.1756210992`
- `FORM_FIELD_PESANAN=entry.794602475`
- `FORM_FIELD_NOTE=entry.1229878423`
- `FORM_FIELD_TOTAL=entry.39066530`
- `FORM_FIELD_NO_ORDER=entry.137521316`

Catatan:

- Flow order utama sekarang lewat `insert-order` ke Apps Script.
- Route Google Form masih ada sebagai route legacy/fallback, bukan jalur utama order saat ini.

### 2.3 Cloudinary

Cloudinary cloud name aktif:

```text
dbqjqi8ke
```

Dipakai di:

- `app/lib/settings.ts`
- `app/lib/payment-verification.ts`

Upload preset yang dipakai code saat ini:

```text
ayam_jukut_preset
```

## 3. Environment Variables

### 3.1 Template env

Template acuan ada di:

- `.env.example`

Variabel yang diharapkan:

```env
APPS_SCRIPT_URL=
GOOGLE_FORM_URL=
FORM_FIELD_NAMA=
FORM_FIELD_PESANAN=
FORM_FIELD_NOTE=
FORM_FIELD_TOTAL=
FORM_FIELD_NO_ORDER=
NEXT_PUBLIC_APPS_SCRIPT_URL=
NEXT_PUBLIC_GOOGLE_FORM_URL=
NEXT_PUBLIC_FORM_FIELD_NAMA=
NEXT_PUBLIC_FORM_FIELD_PESANAN=
NEXT_PUBLIC_FORM_FIELD_NOTE=
NEXT_PUBLIC_FORM_FIELD_TOTAL=
NEXT_PUBLIC_FORM_FIELD_NO_ORDER=
```

### 3.2 Catatan `.env.local`

File `.env.local` yang ada sekarang terlihat bukan sumber konfigurasi utama yang rapi, karena isinya seperti satu baris legacy/terformat tidak normal. Secara praktik, sumber yang lebih jelas saat ini justru:

- `app/lib/settings.ts`
- `app/lib/api-config.ts`
- environment deployment server jika ada

Kalau nanti mau dibersihkan, sebaiknya `.env.local` ditulis ulang mengikuti format `.env.example`.

## 4. Logging dan Debug

Sistem logging aplikasi web sekarang mengikuti `DEVELOPER_MODE`.

File terkait:

- `app/lib/settings.ts`
- `app/lib/logger.ts`
- `app/components/ConsoleGate.tsx`

Perilaku saat ini:

- `DEVELOPER_MODE = false`
  browser console dari app dibungkam, dan helper log developer tidak tampil
- `DEVELOPER_MODE = true`
  log debugging penting tampil untuk bantu tracing flow order dan payment

Helper log:

- `devLog(...)`
- `devWarn(...)`
- `devError(...)`

Jenis log penting yang dipakai:

- create order request/response
- stock/config fetch retry
- payment verification
- payment confirmation proxy
- error integrasi Google Form/Apps Script

Catatan:

- Ini berlaku untuk kode Next.js dalam repo ini.
- Log Google Apps Script di `spreadsheet-script.gs` masih terpisah dan tidak otomatis mengikuti `DEVELOPER_MODE` web.

## 5. Proxy Endpoint Frontend yang Aktif

Base proxy frontend:

```text
/api/proxy
```

Endpoint yang didefinisikan di `app/lib/api-config.ts`:

- `GET /api/proxy/config?api=orders`
- `GET /api/proxy/config?api=orderItemCount`
- `GET /api/proxy/stock`
- `GET /api/proxy/config?api=config`
- `GET /api/proxy/config?api=getNextOrderId`
- `POST /api/proxy/insert-order`
- `POST /api/proxy/stock`
- `GET /api/proxy/config?api=updateStatus&no_order=...&status=...`
- `POST /api/proxy/payment`
- `POST /api/proxy/google-form` (legacy/fallback)

Catatan:

- `ITEMS_WITH_LINKS` masih terdefinisi di config, tapi tidak terlihat dipakai oleh flow web saat ini.
- `SUBMIT_GOOGLE_FORM` juga masih terdefinisi, tapi bukan jalur utama order aktif.

## 6. Endpoint Apps Script yang Aktif

Semua endpoint di bawah memakai base URL Apps Script aktif.

### GET

- `?api=orders`
- `?api=orderItemCount`
- `?api=stock`
- `?api=config`
- `?api=getNextOrderId`
- `?api=deleteOlderThan&days=7`
- `?api=deleteByStatus&status=dibatalkan`
- `?api=updateStatus&no_order=ORD-0001&status=siap`
- `?api=deleteOrder&no_order=ORD-0001`

### POST

Body type yang dikenali:

- `INSERT_ORDER`
- `CONFIRM_PAYMENT`
- `{ updates: [...] }` untuk update stok

## 7. Struktur Sheet yang Dipakai

### 6.1 Orders Sheet

Nama sheet:

```text
Form Responses 1
```

Kolom:

- A: `waktu`
- B: `nama`
- C: `pesanan`
- D: `note`
- E: `total`
- F: `no_order`
- G: `paid`
- H: reserved
- I: `status`
- J: `bukti_pembayaran`

### 6.2 Stock Sheet

Nama sheet:

```text
Stok outlet Cempaka
```

Kolom:

- A: `id_item`
- B: `nama_item`
- C: `stok`
- D: `status`
- E: `catatan`

### 6.3 Config Sheet Area

Sheet config yang dibaca saat ini juga memakai:

```text
Stok outlet Cempaka
```

Cell range:

```text
F2:H2
```

Arti:

- `F2 = jam_buka`
- `G2 = jam_tutup`
- `H2 = max_pesanan`

## 8. Logika Bisnis Penting Saat Ini

### 7.1 Nomor order

- Format: `ORD-0001`, `ORD-0002`, dst
- Sifat: global increment, tidak reset harian
- Dikelola oleh `reserveNextOrderId(sheet)` di `spreadsheet-script.gs`

### 7.2 Format item order

Contoh format yang valid saat ini:

```txt
PKT PA 2
PKT PA SB 1
EXT TP 2
```

Arti:

- Default paket tidak diberi suffix tambahan
- Paket sambal bawang diberi suffix `SB`

### 7.3 Logika stok sambal paket

Aturan saat ini:

- Paket default mengurangi stok `SAMBAL IJO`
- Paket `SB` mengurangi stok `SAMBAL BAWANG`

Sumber logika:

- `app/page.tsx`

### 7.4 Validasi pembayaran

Flow pembayaran saat ini:

1. Upload bukti pembayaran
2. OCR di frontend via Tesseract
3. Validasi nominal dan keyword
4. Upload bukti ke Cloudinary
5. Kirim konfirmasi ke Apps Script
6. Bangun pesan WhatsApp final

Sumber logika:

- `app/lib/payment-verification.ts`
- `app/api/proxy/payment/route.ts`
- `spreadsheet-script.gs`

## 9. File Konfigurasi Utama yang Perlu Dicek Kalau Ada Perubahan

- `app/lib/settings.ts`
- `app/lib/api-config.ts`
- `app/page.tsx`
- `app/components/OrderButtonGrid.tsx`
- `app/components/CurrentOrder.tsx`
- `app/lib/payment-verification.ts`
- `app/lib/qris-generator.ts`
- `spreadsheet-script.gs`

## 10. Catatan Operasional

- Kalau Apps Script diubah, harus redeploy web app.
- Kalau format `pesanan` diubah, parser di frontend dan Apps Script harus ikut dicek.
- Kalau QRIS merchant berubah, ubah template QRIS di code, bukan cuma gambar.
- Kalau `.env.local` ingin dipakai serius, rapikan formatnya agar sinkron dengan `.env.example`.

## 11. Saran Penyimpanan Dokumen

Dokumen ini cocok dipakai sebagai catatan internal operasional. Saat ada perubahan:

- update URL Apps Script
- update URL/form field Google Form
- update Cloudinary
- update nama sheet
- update endpoint baru atau endpoint yang sudah tidak dipakai

Dengan begitu file ini bisa jadi single source of truth untuk setup Jukut yang sedang live.
