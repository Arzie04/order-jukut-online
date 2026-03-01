'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MenuModal from './MenuModal';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';

interface AlertMessage {
  type: 'danger' | 'warning' | 'success';
  message: string;
}

export default function OrderingPage() {
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [note, setNote] = useState('');
  const [total, setTotal] = useState(0);
  const [calcDetails, setCalcDetails] = useState<string>('');
  const [showCalcResult, setShowCalcResult] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasInvalidCodes, setHasInvalidCodes] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [statusReason, setStatusReason] = useState<string | null>(null);
  const [openingTimeText, setOpeningTimeText] = useState<string>('10.00');
  const [closingTimeText, setClosingTimeText] = useState<string>('15.30');
  const orderInputRef = useRef<HTMLTextAreaElement>(null);

  // settings loaded from config API
  const [maxOrders, setMaxOrders] = useState<number>(15);
  const router = useRouter();

  const priceMap: { [key: string]: number } = {
    'PKT PA': 15000,
    'PKT PB': 15000,
    'PKT DD': 15000,
    'PKT SY': 15000,
    'PKT ATI': 13000,
    'PKT KL': 13000,
    'PKT TD': 11000,
    'PKT TT': 11000,
    'NP PA': 11000,
    'NP PB': 11000,
    'NP DD': 11000,
    'NP SY': 11000,
    'NP TD': 7000,
    'NP TG': 3000,
    'NP KG': 3000,
    'NP JK': 4000,
    'NP NP': 4000,
    'EXT SI': 3000,
    'EXT SB': 3000,
    'EXT TP': 1000,
    'EXT TH': 1000,
    'EXT JK': 4000,
    'EXT TG': 3000,
    'EXT KG': 3000,
  };

  const VALID_PREFIX = ['PKT', 'NP', 'EXT'];
  const codeAliases: { [key: string]: string } = {
    'PAHA ATAS': 'PA',
    'PAHA BAWAH': 'PB',
    'PAHA': 'PB',
    'DADA': 'DD',
    'SAYAP': 'SY',
    'TELUR DADAR': 'TD',
    'TAHU TEMPE': 'TT',
    'TEMPE TAHU': 'TT',
    'TEMPE': 'TP',
    'TAHU': 'TH',
    'JUKUT': 'JK',
    'JAKUT': 'JK',
    'TERONG': 'TG',
    'TERONG GORENG': 'TG',
    'KOL': 'KG',
    'KOL GORENG': 'KG',
    'KOBIS': 'KG',
    'KUBIS': 'KG',
    'SAMBAL IJO': 'SI',
    'SAMBAL BAWANG': 'SB',
    'ATI AMPELA': 'ATI',
    'KULIT': 'KL',
    'NON PAKET': 'NP',
    'PAKET': 'PKT',
    'EXTRA': 'EXT',
    'EKSTRA': 'EXT',
    'EX': 'EXT',
  };

  const normalizeLine = (line: string): string => {
    let normalized = line
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^PAKET/, 'PKT')
      .replace(/^PAK /, 'PKT ')
      .replace(/^EX /, 'EXT ')
      .replace(/^EXTRA/, 'EXT');

    for (const [fullName, code] of Object.entries(codeAliases)) {
      normalized = normalized.replace(new RegExp(`\\b${fullName}\\b`, 'g'), code);
    }

    return normalized;
  };

  const parseTimeToMinutes = (timeStr: string | null): number | null => {
    if (!timeStr) return null;
    const normalized = timeStr.replace('.', ':');
    const parts = normalized.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parts[1] ? parseInt(parts[1], 10) : 0;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  };

  const isWithinOpeningHours = (openStr: string | null, closeStr: string | null): boolean => {
    const openMinutes = parseTimeToMinutes(openStr);
    const closeMinutes = parseTimeToMinutes(closeStr);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (openMinutes === null || closeMinutes === null) {
      // fallback: 10.00 - 15.30 WIB
      const fallbackOpen = 10 * 60;
      const fallbackClose = 15 * 60 + 30;
      return nowMinutes >= fallbackOpen && nowMinutes < fallbackClose;
    }

    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  };

  const isValidLine = (line: string): boolean => {
    if (!line) return true;
    const parts = line.split(' ');
    if (parts.length < 2) return false;
    if (!VALID_PREFIX.includes(parts[0])) return false;
    return true;
  };

  const addDefaultQuantity = (line: string): string => {
    const parts = line.split(' ');

    if (parts.length === 2) {
      return `${parts[0]} ${parts[1]} 1`;
    }

    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      if (!isNaN(Number(lastPart)) && Number(lastPart) > 0) {
        return line;
      }
      return `${line} 1`;
    }

    return line;
  };

  const validateAndFormat = () => {
    if (!orderInputRef.current) return;

    const lines = orderInputRef.current.value.split('\n');
    let valid = true;

    const normalized = lines.map((line) => {
      const clean = normalizeLine(line);
      if (!isValidLine(clean)) {
        valid = false;
        return clean;
      }
      return addDefaultQuantity(clean);
    });

    orderInputRef.current.value = normalized.join('\n');
    setOrder(normalized.join('\n'));

    if (!valid) {
      orderInputRef.current.classList.add('border-red-500');
      setAlert({
        type: 'danger',
        message: '❌ Format salah. Contoh benar: PKT PA 1 atau PKT Paha Atas',
      });
      setShowAlertModal(true);
    } else {
      orderInputRef.current.classList.remove('border-red-500');
      setAlert(null);
      setShowAlertModal(false);
    }
  };

  const calculateTotal = () => {
    setAlert(null);
    const orderText = order.trim();

    if (!orderText) {
      setShowCalcResult(false);
      setCalcDetails('');
      setHasInvalidCodes(false);
      return false;
    }

    let totalAmount = 0;
    const lines = orderText.split('\n');
    const details: string[] = [];
    let invalid = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const code = parts.slice(0, 2).join(' ');
        const qty = parseInt(parts[2], 10) || 0;
        const price = priceMap[code];

        if (price !== undefined && qty > 0) {
          const lineTotal = price * qty;
          totalAmount += lineTotal;
          details.push(
            `${code} ${qty} = ${lineTotal.toLocaleString('id-ID')}`
          );
        } else {
          invalid = true;
          details.push(`<span class="text-red-500">${trimmed} (tidak dikenali)</span>`);
        }
      } else {
        invalid = true;
        details.push(`<span class="text-red-500">${trimmed} (format salah)</span>`);
      }
    });

    const resultHTML =
      details.length === 0
        ? 'Tidak ada pesanan valid.'
        : details.join('<br/>') +
          '<br/>------------------------<br/>TOTAL = ' +
          totalAmount.toLocaleString('id-ID');

    setCalcDetails(resultHTML);
    setShowCalcResult(true);
    setTotal(totalAmount);
    setHasInvalidCodes(invalid);

    return !invalid;
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOrder(e.target.value);
    setShowCalcResult(false);
  };

  const handleOrderBlur = () => {
    validateAndFormat();
  };

  const handleOrderKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      setTimeout(validateAndFormat, 0);
    }
  };

  const handleOpenConfirm = () => {
    if (!isStoreOpen) {
      setAlert({
        type: 'warning',
        message: 'Maaf Outlet sudah tutup atau batas maksimal pesanan tercapai.',
      });
      setShowAlertModal(true);
      return;
    }
    const nameVal = name.trim();
    const orderVal = order.trim();

    setAlert(null);
    setShowAlertModal(false);

    if (!nameVal || !orderVal) {
      setAlert({
        type: 'danger',
        message: 'Nama dan pesanan wajib diisi.',
      });
      setShowAlertModal(true);
      return;
    }

    const isValid = calculateTotal();
    if (!isValid) {
      setAlert({
        type: 'danger',
        message:
          'Terdapat kode/menu yang salah. Periksa label merah di hasil perhitungan.',
      });
      setShowAlertModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleModalSubmit = () => {
    const nameVal = name.trim();
    const orderVal = order.trim();
    const noteVal = note.trim();

    if (!isStoreOpen) {
      setAlert({
        type: 'warning',
        message: 'Maaf Outlet sudah tutup atau batas maksimal pesanan tercapai.',
      });
      setShowAlertModal(true);
      return;
    }

    setAlert(null);
    setShowAlertModal(false);

    if (!nameVal || !orderVal) {
      setAlert({
        type: 'danger',
        message: 'Nama dan pesanan wajib diisi.',
      });
      setShowAlertModal(true);
      return;
    }

    // Rate limiting
    const last = localStorage.getItem('lastOrderTime');
    const nowms = Date.now();
    if (last && nowms - parseInt(last, 10) < 60000) {
      const remain = Math.ceil((60000 - (nowms - parseInt(last, 10))) / 1000);
      setAlert({
        type: 'warning',
        message: `Tunggu ${remain} detik sebelum pesan lagi.`,
      });
      setShowAlertModal(true);
      return;
    }
    localStorage.setItem('lastOrderTime', nowms.toString());

    // Submit to Google Forms
    const formURL =
      'https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/formResponse';

    const formData = new FormData();
    formData.append('entry.1756210992', nameVal);
    formData.append('entry.794602475', orderVal);
    formData.append('entry.1229878423', noteVal);
    formData.append('entry.39066530', total.toLocaleString('id-ID'));

    fetch(formURL, { method: 'POST', mode: 'no-cors', body: formData });

    // Send WhatsApp message
    const now = new Date();
    const time =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0')+ 
      ':' +
      now.getSeconds().toString().padStart(2, '0');
    const formattedTotal = total.toLocaleString('id-ID').replace(/\./g, ',');
    const waText = encodeURIComponent(
      `!!JANGAN UBAH PESAN INI!! Pesanan pada jam ${time} dengan Nama ${nameVal}, total ${formattedTotal}`
    );
    const waUrl = `https://wa.me/62882007448066?text=${waText}`;
    window.open(waUrl, '_blank');

    // Reset form
    setName('');
    setOrder('');
    setNote('');
    setTotal(0);
    setShowConfirmModal(false);
    setAlert({
      type: 'success',
      message: 'Pesanan berhasil dikirim! Silakan kirim bukti pembayaran via WhatsApp.',
    });
    setShowAlertModal(true);
  };

  // fetch configuration (jam buka/tutup, max pesanan) from API
  const fetchConfig = async () => {
    try {
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbwhQv8nQxzbxESJddGaAZQNpVFF20HepUwe8lzddBqtydqvcQyIB0_KdcWFpOaIbLIZ/exec?api=config'
      );
      const data = await res.json();
      console.log('[CONFIG-API] raw config:', data);

      const jamBuka =
        typeof data.jam_buka === 'string' && data.jam_buka.trim() !== ''
          ? data.jam_buka.trim()
          : null;
      const jamTutup =
        typeof data.jam_tutup === 'string' && data.jam_tutup.trim() !== ''
          ? data.jam_tutup.trim()
          : null;

      let cfgMax = 15;
      if (typeof data.max_pesanan === 'number') {
        cfgMax = data.max_pesanan;
      } else if (data.max_pesanan != null) {
        const parsed = parseInt(String(data.max_pesanan), 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          cfgMax = parsed;
        }
      }

      setMaxOrders(cfgMax);
      if (jamBuka) setOpeningTimeText(jamBuka.replace(':', '.'));
      if (jamTutup) setClosingTimeText(jamTutup.replace(':', '.'));

      return {
        jamBuka,
        jamTutup,
        maxOrders: cfgMax,
      };
    } catch (e) {
      console.error('unable to fetch config', e);
      return null;
    }
  };

  // hit spreadsheet API to get today's valid order count
  // hanya hitung baris yang kolom "no_order"-nya terisi
  const fetchOrderCount = async () => {
    try {
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbwhQv8nQxzbxESJddGaAZQNpVFF20HepUwe8lzddBqtydqvcQyIB0_KdcWFpOaIbLIZ/exec?api=orders'
      );
      const data = await res.json();
      console.log('[ORDER-API] raw data:', data);

      let count = 0;

      // data berupa array of object dari ?api=orders
      if (Array.isArray(data)) {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();

        count = data.filter((row: any) => {
          if (!row || typeof row !== 'object') return false;

          const noOrder = row.no_order;
          if (
            noOrder === null ||
            noOrder === undefined ||
            String(noOrder).trim() === ''
          ) {
            return false;
          }

          if (!row.waktu) return false;
          const t = new Date(row.waktu);
          if (Number.isNaN(t.getTime())) return false;

          return (
            t.getFullYear() === y &&
            t.getMonth() === m &&
            t.getDate() === d
          );
        }).length;
      }

      console.log('[ORDER-API] valid order count:', count);
      return count;
    } catch (e) {
      console.error('unable to fetch order count', e);
      return 0;
    }
  };

  const getDynamicStatus = (
    config: {
      jamBuka: string | null;
      jamTutup: string | null;
      maxOrders: number;
    },
    orderCount: number
  ): { isOpen: boolean; reason: string | null } => {
    const withinHours = isWithinOpeningHours(config.jamBuka, config.jamTutup);
    const maxOrdersReached = orderCount >= config.maxOrders;

    if (!withinHours) {
      const openLabel = config.jamBuka
        ? config.jamBuka.replace(':', '.')
        : openingTimeText;
      const closeLabel = config.jamTutup
        ? config.jamTutup.replace(':', '.')
        : closingTimeText;
      return {
        isOpen: false,
        reason: `Waktu pemesanan online hanya ${openLabel} - ${closeLabel} WIB.`,
      };
    }

    if (maxOrdersReached) {
      return {
        isOpen: false,
        reason: 'Batas maksimal pesanan hari ini sudah tercapai.',
      };
    }

    return { isOpen: true, reason: null };
  };
  
  // cek status buka/tutup saat mount dan polling tiap 15 detik
  useEffect(() => {
    let intervalId: number | undefined;

    const checkStatus = async () => {
      const config = await fetchConfig();
      if (!config) {
        setIsStoreOpen(false);
        setStatusReason(
          'Tidak dapat mengambil konfigurasi outlet. Silakan coba lagi nanti.'
        );
        return;
      }

      const orderCount = await fetchOrderCount();
      const dynamicStatus = getDynamicStatus(
        {
          jamBuka: config.jamBuka,
          jamTutup: config.jamTutup,
          maxOrders: config.maxOrders > 0 ? config.maxOrders : 15,
        },
        orderCount
      );

      setIsStoreOpen(dynamicStatus.isOpen);
      setStatusReason(dynamicStatus.reason);

      // logging
      console.log('status check:', {
        orderCount,
        maxOrders: config.maxOrders,
        withinHours: isWithinOpeningHours(config.jamBuka, config.jamTutup),
        finalStatus: dynamicStatus.isOpen,
        reason: dynamicStatus.reason,
      });
    };

    checkStatus();
    intervalId = window.setInterval(checkStatus, 15000);

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      {/* Header */}
      <div className="w-full h-20 md:h-32 bg-white shadow-md overflow-hidden mb-6">
        <img
          src="/Header.jpeg"
          alt="Header"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Form */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm">
            <div className="text-center mb-2 font-bold">
              ‼️ HARAP DIBACA SEBELUM PESAN ‼️
            </div>
            <div className="text-center mb-3 font-semibold text-red-600">
              Pemesanan online hanya dilayani pukul {openingTimeText} - {closingTimeText}{' '}
              WIB atau sampai batas maksimal pesanan hari ini tercapai.
            </div>

            <div className="mb-3">
              <h6 className="font-bold mb-1">FORMAT KODE MENU</h6>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>PKT</strong> → Menu Paket
                </li>
                <li>
                  <strong>NP</strong> → Menu Non Paket
                </li>
                <li>
                  <strong>EXT</strong> → Tambahan / Extra
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <h6 className="font-bold mb-1">KODE PILIHAN MENU</h6>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>
                  <strong>PA</strong> = Paha Atas
                </li>
                <li>
                  <strong>PB</strong> = Paha Bawah
                </li>
                <li>
                  <strong>DD</strong> = Dada
                </li>
                <li>
                  <strong>SY</strong> = Sayap
                </li>
                <li>
                  <strong>TD</strong> = Telur Dadar
                </li>
                <li>
                  <strong>TT</strong> = Tahu Tempe
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <h6 className="font-bold mb-1">KODE TAMBAHAN (EXT)</h6>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>
                  <strong>TP</strong> = Tempe
                </li>
                <li>
                  <strong>TH</strong> = Tahu
                </li>
                <li>
                  <strong>JK</strong> = Jukut
                </li>
                <li>
                  <strong>TG</strong> = Terong
                </li>
                <li>
                  <strong>KG</strong> = Kol
                </li>
                <li>
                  <strong>SI</strong> = Sambal Ijo
                </li>
                <li>
                  <strong>SB</strong> = Sambal Bawang
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <h6 className="font-bold mb-1">CATATAN PENTING</h6>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>Ati ampela & kulit hanya bisa dipesan langsung di outlet.</li>
                <li>
                  Sambal bawang stok terbatas; jika habis otomatis diganti sambal
                  ijo.
                </li>
                <li>
                  Jika bagian ayam tidak tersedia, kami akan menggantinya dengan bagian lain yang ada.
                </li>
                <li>
                  Nasi daun jeruk stok hanya sedikit; hanya bisa dipesan di
                  outlet saat stok ada.
                </li>
              </ul>
            </div>

            <div className="mb-2">
              <h6 className="font-bold mb-2">CONTOH PENULISAN PESANAN</h6>
              <pre className="bg-white p-2 rounded border border-gray-300 text-xs overflow-x-auto">
                {`PKT PA 1
PKT SY 2
NP DD 2
EXT SI 1
EXT JK 1
EXT TP 2
EXT TH 2`}
              </pre>
            </div>
          </div>

          {/* Menu Button */}
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => setShowMenuModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm md:text-base font-semibold"
            >
              📋 Lihat Menu
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="nameInput" className="block font-semibold mb-2">
                Nama Pemesan
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-3 py-2">👤</span>
                <input
                  type="text"
                  id="nameInput"
                  required
                  placeholder="Masukkan nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2 outline-none"
                />
              </div>
            </div>

            {/* Order Input */}
            <div>
              <label htmlFor="orderInput" className="block font-semibold mb-2">
                Pesanan
              </label>
              <div className="flex items-start border border-gray-300 rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-3 py-2">📝</span>
                <textarea
                  id="orderInput"
                  ref={orderInputRef}
                  rows={4}
                  required
                  placeholder="Contoh:&#10;PKT PA 1&#10;NP DD 2&#10;EXT SI 1"
                  value={order}
                  onChange={handleOrderChange}
                  onBlur={handleOrderBlur}
                  onKeyDown={handleOrderKeyDown}
                  className="flex-1 px-4 py-2 outline-none resize-none"
                />
              </div>
              <small className="text-gray-600 block mt-1">
                Format: <strong>PKT/NP/EXT</strong> + <strong>KODE</strong> +{' '}
                <strong>JUMLAH</strong> (angka otomatis 1 jika kosong)
              </small>

              <button
                type="button"
                onClick={calculateTotal}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Hitung Total
              </button>

              {showCalcResult && (
                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div
                    dangerouslySetInnerHTML={{ __html: calcDetails }}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Note Input */}
            <div>
              <label htmlFor="noteInput" className="block font-semibold mb-2">
                Catatan (opsional)
              </label>
              <textarea
                id="noteInput"
                rows={2}
                placeholder="Catatan tambahan"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none"
              />
            </div>

            {/* Warning */}
            <div className="text-center text-sm text-gray-600 py-2 bg-gray-50 rounded-lg">
              Pastikan pesanan benar, kesalahan pesanan karena kesalahan tulis bukan
              tanggung jawab kami
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={!isStoreOpen}
              className={`w-full py-3 font-bold text-lg rounded-lg transition ${
                isStoreOpen
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Pesan Sekarang
            </button>
            {!isStoreOpen && (
              <div className="mt-2 text-center text-sm text-red-600 font-semibold">
                {statusReason ||
                  'Maaf Outlet sudah tutup atau batas maksimal pesanan tercapai.'}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modals */}
      <MenuModal isOpen={showMenuModal} onClose={() => setShowMenuModal(false)} />
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        total={total}
        onSubmit={handleModalSubmit}
      />
      <AlertModal
        isOpen={showAlertModal}
        type={alert?.type || 'info'}
        message={alert?.message || ''}
        onClose={() => setShowAlertModal(false)}
      />
    </div>
  );
}
