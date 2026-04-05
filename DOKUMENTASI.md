# Dokumentasi Aplikasi Pemesanan Online

Selamat datang di dokumentasi untuk aplikasi pemesanan online "Jukut". Dokumen ini akan memandu Anda melalui konfigurasi utama, pemeliharaan, dan cara kerja aplikasi ini.

## Daftar Isi
1.  [Gambaran Umum](#gambaran-umum)
2.  [Menjalankan Proyek Secara Lokal](#menjalankan-proyek-secara-lokal)
3.  [Konfigurasi Utama (Paling Penting)](#konfigurasi-utama-paling-penting)
    -   [Mengubah Menu, Harga, dan Gambar Produk](#mengubah-menu-harga-dan-gambar-produk)
    -   [Mengatur Status Toko (Buka/Tutup)](#mengatur-status-toko-buka-tutup)
    -   [Mengaktifkan Fitur Khusus (Contoh: Tema Lebaran)](#mengaktifkan-fitur-khusus-contoh-tema-lebaran)
4.  [Mengubah Halaman "Toko Tutup"](#mengubah-halaman-toko-tutup)
5.  [Mengelola Aset Visual dan Audio](#mengelola-aset-visual-dan-audio)
6.  [Backend: Integrasi dengan Google Sheets](#backend-integrasi-dengan-google-sheets)
    -   [Cara Kerja](#cara-kerja)
    -   [Memperbarui URL API](#memperbarui-url-api)

---

### Gambaran Umum
Aplikasi ini adalah sebuah platform pemesanan makanan online yang dibangun menggunakan **Next.js** (framework React). Pesanan yang dibuat oleh pelanggan akan secara otomatis dikirim dan dicatat ke dalam **Google Sheet** yang telah ditentukan.

Struktur folder utama yang perlu diperhatikan:
-   `app/`: Berisi halaman-halaman dan komponen utama aplikasi.
-   `app/lib/`: **Folder paling penting untuk konfigurasi.** Di sinilah Anda akan mengubah pengaturan menu, harga, dan status toko.
-   `public/`: Berisi semua aset statis seperti gambar produk, logo, video tutorial, dan file suara.
-   `spreadsheet-script.gs`: Berisi kode Google Apps Script yang berfungsi sebagai backend untuk menerima dan mencatat pesanan.

---

### Menjalankan Proyek Secara Lokal
Untuk menjalankan dan menguji aplikasi di komputer Anda:
1.  Buka terminal di direktori proyek.
2.  Jalankan `npm install` untuk menginstal semua dependensi yang dibutuhkan.
3.  Jalankan `npm run dev` untuk memulai server pengembangan.
4.  Buka browser dan akses `http://localhost:3000`.

---

### Konfigurasi Utama (Paling Penting)
Semua konfigurasi utama terkait operasional toko dapat ditemukan di dalam file: `app/lib/settings.ts`.

#### Mengubah Menu, Harga, dan Gambar Produk
Untuk mengubah daftar menu, harga, atau gambar:
1.  Buka file `app/lib/settings.ts`.
2.  Cari variabel `menuItems`.
3.  Setiap item menu direpresentasikan sebagai sebuah objek di dalam array ini.

**Contoh:**
```typescript
{
    name: 'Paket Dada',
    price: 17000,
    image: '/Foto Produk/Paket Dada.png',
    description: 'Nasi + Dada + Sambal + Lalapan',
    isAvailable: true, // true jika tersedia, false jika habis
},
```
-   **`name`**: Nama menu yang akan tampil.
-   **`price`**: Harga menu (hanya angka, tanpa titik atau "Rp").
-   **`image`**: Path ke gambar produk. Gambar harus diletakkan di dalam folder `public/Foto Produk/`.
-   **`description`**: Deskripsi singkat menu.
-   **`isAvailable`**: Untuk menandai stok. Jika `false`, pelanggan tidak bisa memesan item ini.

#### Mengatur Status Toko (Buka/Tutup)
Untuk membuka atau menutup toko:
1.  Buka file `app/lib/settings.ts`.
2.  Cari variabel `isStoreOpen`.
    -   Ubah nilainya menjadi `true` untuk **membuka** toko.
    -   Ubah nilainya menjadi `false` untuk **menutup** toko.
3.  Jika `isStoreOpen` diatur ke `false`, pengunjung akan secara otomatis dialihkan ke halaman "Toko Tutup".

#### Mengaktifkan Fitur Khusus (Contoh: Tema Lebaran)
Aplikasi ini memiliki pengaturan untuk tema-tema khusus.
1.  Buka file `app/lib/settings.ts`.
2.  Cari variabel seperti `isRamadan` atau `isLebaran`.
3.  Ubah nilainya menjadi `true` untuk mengaktifkan fitur terkait (misalnya, musik atau ornamen lebaran).

---

### Mengubah Halaman "Toko Tutup"
Jika Anda ingin mengubah tampilan atau tulisan pada halaman yang muncul saat toko tutup:
1.  Buka file `app/closed/page.tsx`.
2.  Anda dapat mengedit konten JSX di dalam file ini seperti mengedit halaman web biasa.

---

### Mengelola Aset Visual dan Audio
Semua file media (gambar, video, suara) disimpan di dalam folder `public`.
-   **Gambar Produk**: `public/Foto Produk/`
-   **Video Tutorial**: `public/tutorial/`
-   **Gambar Ornamen**: `public/Ornamen/`
-   **Suara**: `public/sound/`

Untuk mengganti gambar, cukup ganti file yang ada dengan file baru yang memiliki nama sama, atau unggah file baru dan perbarui path-nya di `app/lib/settings.ts`.

---

### Backend: Integrasi dengan Google Sheets

#### Cara Kerja
Aplikasi tidak menggunakan database tradisional. Sebagai gantinya, setiap pesanan yang berhasil akan dikirim ke sebuah Google Apps Script yang terhubung dengan Google Sheet Anda. Skrip ini (dari file `spreadsheet-script.gs`) akan mengambil data pesanan dan menuliskannya sebagai baris baru di dalam sheet.

#### Memperbarui URL API
Jika Anda membuat Google Sheet baru atau men-deploy ulang Apps Script, Anda akan mendapatkan URL Web App yang baru. URL ini harus diperbarui di dalam aplikasi.
1.  Buka file `app/lib/api-config.ts`.
2.  Cari variabel `API_URL`.
3.  Ganti nilai string yang ada dengan URL Web App Google Apps Script Anda yang baru.

**Penting:** Pastikan saat men-deploy skrip di Google Apps Script, Anda memberikan akses "Execute as: Me" dan "Who has access: Anyone".
