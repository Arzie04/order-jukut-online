'use client';

export default function OrderInstructions({ openingTimeText, closingTimeText }: { openingTimeText: string, closingTimeText: string }) {
  return (
    <div className="bg-yellow-50 p-4 rounded-xl mb-6 text-sm border border-yellow-200">
      <div className="text-center mb-2 font-bold text-yellow-800">
        ⚠️ HARAP DIBACA SEBELUM PESAN ⚠️
      </div>
      <div className="text-center mb-3 font-semibold text-red-600">
        Pemesanan online hanya dilayani pukul {openingTimeText} - {closingTimeText}{' '}
        WIB atau sampai batas maksimal pesanan hari ini tercapai.
      </div>

      <div className="mb-3">
        <h6 className="font-bold mb-1 text-gray-800">CARA MEMESAN</h6>
        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-gray-700">
          <li>
            Pilih kategori menu di bagian atas (Paket, Non-Paket, Tambahan).
          </li>
          <li>
            Klik tombol menu yang diinginkan untuk menambahkannya ke daftar pesanan.
          </li>
          <li>
            Anda dapat menambah atau mengurangi jumlah porsi di bagian <strong>"Pesanan Anda"</strong>.
          </li>
          <li>
            Isi Nama Pemesan dan Catatan (jika ada, misalnya: Sambal Bawang, atau diambil jam 12.00 dll.), lalu klik <strong>"Pesan Sekarang"</strong>.
          </li>
        </ul>
      </div>

      <div className="mb-3">
        <h6 className="font-bold mb-1 text-gray-800">CATATAN PENTING</h6>
        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-gray-700">
          <li>Ati ampela & kulit stok terbatas; jika habis otomatis diganti dengan bagian lain yang ada.</li>
          <li>
            Sambal bawang stok terbatas; jika habis otomatis diganti sambal
            ijo.
          </li>
          <li>
            Jika bagian ayam yang dipesan tidak tersedia, kami akan menggantinya dengan bagian lain yang ada.
          </li>
          <li>
            Nasi daun jeruk stok hanya sedikit; hanya bisa dipesan di
            outlet saat stok ada.
          </li>
          <li className="font-bold text-red-700 bg-red-50 p-1 rounded">
            Pesanan masuk akan dibuat sesuai jam buka outlet dan sesuai urutan pesanan.
          </li>
        </ul>
      </div>
    </div>
  );
}
