'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderingPage from './components/OrderingPage';
import LoadingScreen from './components/LoadingScreen';
import { API_URLS } from './lib/api-config';
import { StockItem, OrderItem, AlertMessage } from './components/OrderingPage'; // Import interfaces

const priceMap: { [key: string]: number } = {
  'PKT PA': 15000, 'PKT PB': 15000, 'PKT DD': 15000, 'PKT SY': 15000, 'PKT ATI': 13000,
  'PKT KL': 13000, 'PKT TD': 11000, 'PKT TT': 11000, 'NP PA': 11000, 'NP PB': 11000,
  'NP DD': 11000, 'NP SY': 11000, 'NP TD': 7000, 'NP ATI': 9000, 'NP KL': 9000, 'EXT NDJ': 5000, 'EXT NSP': 4000, 'EXT SI': 3000, 'EXT SB': 3000, 'EXT TP': 1000,
  'PKT PA NDJ': 17000, 'PKT PB NDJ': 17000, 'PKT DD NDJ': 17000, 'PKT SY NDJ': 17000,
  'PKT ATI NDJ': 15000, 'PKT KL NDJ': 15000, 'PKT TD NDJ': 13000, 'PKT TT NDJ': 13000,
  'EXT TH': 1000, 'EXT JK': 4000, 'EXT TG': 3000, 'EXT KG': 3000, 
};

const itemCodeToNameMap: { [key: string]: string } = {
  'PA': 'PAHA ATAS', 'PB': 'PAHA BAWAH', 'DD': 'DADA', 'SY': 'SAYAP', 'TD': 'TELUR DADAR',
  'TP': 'TEMPE', 'TH': 'TAHU', 'JK': 'JUKUT', 'TG': 'TERONG', 'KG': 'KOL', 'SI': 'SAMBAL IJO',
  'SB': 'SAMBAL BAWANG', 'NDJ': 'NASI DAUN JERUK', 'NSP': 'NASI PUTIH', 'ATI': 'ATI AMPELA', 'KL': 'KULIT', 
};

export default function Home() {
  // --- State previously in page.tsx ---
  const [pageIsLoading, setPageIsLoading] = useState(true);
  
  // --- State moved from OrderingPage ---
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState(''); // Kept in sync for submission
  const [total, setTotal] = useState(0);
  const [calcDetails, setCalcDetails] = useState<string>('');
  const [showCalcResult, setShowCalcResult] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);

  // --- State for store status and data ---
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [statusReason, setStatusReason] = useState<string | null>(null);
  const [openingTimeText, setOpeningTimeText] = useState('10.00');
  const [closingTimeText, setClosingTimeText] = useState('15.30');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [maxOrders, setMaxOrders] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  // --- LOGIC MOVED FROM OrderingPage ---

  const handleAddOrUpdateItem = (code: string, newQty?: number) => {
    setOrderItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.code === code);
      let updatedItems = [...currentItems];

      if (existingItemIndex > -1) {
        if (newQty !== undefined && newQty > 0) {
          updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], qty: newQty };
        } else {
          updatedItems.splice(existingItemIndex, 1);
        }
      } else if (newQty !== undefined && newQty > 0) {
        updatedItems.push({ code, qty: newQty });
      }
      
      const newOrderString = updatedItems.map(item => `${item.code} ${item.qty}`).join('\\n');
      setOrder(newOrderString); // Sync the legacy order string
      setShowCalcResult(false);
      return updatedItems;
    });
  };

  const calculateTotal = useCallback(() => {
    if (orderItems.length === 0) {
      setShowCalcResult(false); setCalcDetails(''); return false;
    }
    let totalAmount = 0;
    const details: string[] = [];
    orderItems.forEach(({ code, qty }) => {
      const price = priceMap[code];
      const lineTotal = (price || 0) * qty;
      totalAmount += lineTotal;
      details.push(`${code} ${qty} = ${lineTotal.toLocaleString('id-ID')}`);
    });
    const resultHTML = details.join('<br/>') + '<br/>------------------------<br/>TOTAL = ' + totalAmount.toLocaleString('id-ID');
    setCalcDetails(resultHTML);
    setShowCalcResult(true);
    setTotal(totalAmount);
    return true;
  }, [orderItems]);
  
  const getOrderQuantities = () => {
    const quantities: { [key: string]: number } = {};
    for (const item of orderItems) {
      const parts = item.code.split(' ');
      const itemCode = parts[1];
      
      if (itemCode === 'TT') {
        quantities['TAHU'] = (quantities['TAHU'] || 0) + item.qty;
        quantities['TEMPE'] = (quantities['TEMPE'] || 0) + item.qty;
      } else if (itemCodeToNameMap[itemCode]) {
        quantities[itemCodeToNameMap[itemCode]] = (quantities[itemCodeToNameMap[itemCode]] || 0) + item.qty;
      }

      if (parts.length > 2 && parts[2] === 'NDJ') {
        quantities['NASI DAUN JERUK'] = (quantities['NASI DAUN JERUK'] || 0) + item.qty;
      }
    }
    return quantities;
  };

  const getNextOrderId = async (): Promise<string> => {
    try {
      const res = await fetch(API_URLS.ORDERS);
      const data = await res.json();

      if (Array.isArray(data)) {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const d = today.getDate();

        const todaysOrders = data.filter((row: any) => {
          if (!row || typeof row !== 'object' || !row.waktu || !row.no_order) return false;
          const t = new Date(row.waktu);
          return !Number.isNaN(t.getTime()) && t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
        });

        if (todaysOrders.length === 0) {
          return 'ORD-0001';
        }

        // Cari angka terbesar dari order hari ini (Lebih Aman)
        const maxNum = todaysOrders.reduce((max: number, row: any) => {
          if (row.no_order && typeof row.no_order === 'string' && row.no_order.startsWith('ORD-')) {
            const num = parseInt(row.no_order.replace('ORD-', ''), 10);
            return !isNaN(num) && num > max ? num : max;
          }
          return max;
        }, 0);

        const nextNum = maxNum + 1;
        return `ORD-${nextNum.toString().padStart(4, '0')}`;
      }

      const fallbackNum = (data.length || 0) + 1;
      return `ORD-${fallbackNum.toString().padStart(4, '0')}`;

    } catch (e) {
      console.error('unable to fetch/parse order ID', e);
      return `ORD-ERR-${Date.now().toString().slice(-5)}`;
    }
  };

  const handleOpenConfirm = (): boolean => {
    if (!name.trim() || orderItems.length === 0) {
      setAlert({ type: 'danger', message: 'Nama dan pesanan wajib diisi.' }); return false;
    }

    // Validasi Stok dan Hapus Item yang Habis
    const orderQuantities = getOrderQuantities();
    const insufficientStockNames = new Set<string>();
    const unavailableMessageParts: string[] = [];

    for (const itemName in orderQuantities) {
      const stockItem = stock.find(item => item.nama_item.toUpperCase() === itemName.toUpperCase());
      const available = stockItem ? stockItem.stok : 0;
      if (available < orderQuantities[itemName]) {
        insufficientStockNames.add(itemName);
        unavailableMessageParts.push(`${itemName} (Stok: ${available})`);
      }
    }

    if (insufficientStockNames.size > 0) {
      const newOrderItems = orderItems.filter(item => {
        const parts = item.code.split(' ');
        const suffix = parts[1];
        let consumes: string[] = [];
        
        if (suffix === 'TT') {
          consumes = ['TAHU', 'TEMPE'];
        } else if (itemCodeToNameMap[suffix]) {
          consumes = [itemCodeToNameMap[suffix]];
        }

        // Cek jika menggunakan Nasi Daun Jeruk
        if (parts.length > 2 && parts[2] === 'NDJ') {
          consumes.push('NASI DAUN JERUK');
        }

        // Hapus item jika salah satu bahan bakunya tidak cukup
        return !consumes.some(name => insufficientStockNames.has(name));
      });

      setOrderItems(newOrderItems);
      const newOrderString = newOrderItems.map(item => `${item.code} ${item.qty}`).join('\n');
      setOrder(newOrderString);
      
      setAlert({ type: 'danger', message: `Stok tidak cukup: ${unavailableMessageParts.join(', ')}. Item terkait telah dihapus dari pesanan.` });
      return false;
    }

    if (!calculateTotal()) {
      setAlert({ type: 'danger', message: 'Terjadi kesalahan saat menghitung total.' }); return false;
    }
    return true;
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    setAlert(null);

    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSceaYNjewOa6lWgeab7Zo-pkJ7WUBnox9C8DQ3HX9lh8E5IeQ/formResponse';
    const orderString = orderItems.map(item => `${item.code} ${item.qty}`).join('\n');

    const formData = new FormData();
    formData.append('entry.1756210992', name);
    formData.append('entry.794602475', orderString);
    formData.append('entry.1229878423', note);
    formData.append('entry.39066530', total.toString());

    try {
      // Step 1: Calculate Order ID client-side (Prediction)
      const orderNumber = await getNextOrderId();

      // Step 2: Fire-and-forget submission to Google Form
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      // Step 3: Update Stock via API (Background Process)
      const quantities = getOrderQuantities();
      const stockUpdates = Object.entries(quantities).map(([nama_item, qty]) => ({
        nama_item,
        quantity: qty
      }));

      console.log("DEBUG: Mengirim update stok ke API:", JSON.stringify(stockUpdates));

      if (stockUpdates.length > 0) {
        fetch(API_URLS.UPDATE_STOCK, {
          method: 'POST',
          mode: 'no-cors', // Penting: agar browser tidak memblokir request ke Google Script
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ updates: stockUpdates })
        }).catch(e => console.error("Gagal update stok:", e));
      }

      // Step 4: Construct the final WhatsApp message
      const now = new Date();
      const timeString = `${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;

      const orderDetailsString = orderItems.map(item => {
          const price = priceMap[item.code] || 0;
          const lineTotal = price * item.qty;
          return `${item.code} ${item.qty} = ${lineTotal.toLocaleString('id-ID')}`;
      }).join('\n');

      let waMessage = `!!JANGAN UBAH PESAN INI!!\n\n`;
      waMessage += `${orderNumber}\n\n`;
      waMessage += `Pesanan pada jam ${timeString}\ndengan Nama ${name},\n\n`;
      waMessage += `${orderDetailsString}\n\n`;
      if (note) {
          waMessage += `Note : ${note}\n`;
      }
      waMessage += `total ${total.toLocaleString('id-ID')}\n\nPembayaran QRIS\n\n*kirim bukti pembayaran disini :\n`;

      const waUrl = `https://wa.me/62882007448066?text=${encodeURIComponent(waMessage)}`;
      
      setWhatsappMessage(waMessage);
      setWhatsappUrl(waUrl);

      setAlert({
        type: 'success',
        message: `Pesanan Anda (${orderNumber}) berhasil dikirim! Silakan simpan bukti transaksi QRIS dan kirimkan via WhatsApp Bersama Pesan ini.`
      });

      // Reset form
      setName('');
      setNote('');
      setOrderItems([]);
      setOrder('');
      setTotal(0);
      setCalcDetails('');
      setShowCalcResult(false);

    } catch (error: any) {
      console.error('Google Form Submission Error:', error);
      setAlert({
        type: 'danger',
        message: `Terjadi kesalahan saat mengirim pesanan: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- POLLING AND DATA FETCHING LOGIC ---
  
  const parseTimeToMinutes = (timeStr: string | null): number | null => {
    if (!timeStr) return null;
    const normalized = timeStr.replace('.', ':');
    const [hour, minute] = normalized.split(':').map(p => parseInt(p, 10));
    return (isNaN(hour) || isNaN(minute)) ? null : hour * 60 + minute;
  };

  const isWithinOpeningHours = useCallback((openStr: string, closeStr: string) => {
    const openMinutes = parseTimeToMinutes(openStr);
    const closeMinutes = parseTimeToMinutes(closeStr);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (openMinutes === null || closeMinutes === null) {
      return nowMinutes >= (10 * 60) && nowMinutes < (15 * 60 + 30); // Fallback
    }
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }, []);

  const getDynamicStatus = useCallback((config: { jamBuka: string; jamTutup: string; maxOrders: number }, orderCount: number) => {
    if (!isWithinOpeningHours(config.jamBuka, config.jamTutup)) {
      const openLabel = config.jamBuka?.replace(':', '.') || '10.00';
      const closeLabel = config.jamTutup?.replace(':', '.') || '15.30';
      return { isOpen: false, reason: `Waktu pemesanan online hanya ${openLabel} - ${closeLabel} WIB.` };
    }
    if (orderCount >= config.maxOrders) {
      return { isOpen: false, reason: 'Batas maksimal pesanan hari ini sudah tercapai.' };
    }
    return { isOpen: true, reason: null };
  }, [isWithinOpeningHours]);

  const fetchConfigAndOrders = useCallback(async () => {
    try {
      const [configRes, ordersRes] = await Promise.all([
        fetch(API_URLS.CONFIG),
        fetch(API_URLS.ORDERS)
      ]);
      const configData = await configRes.json();
      const ordersData = await ordersRes.json();

      // Process config
      const jamBuka = configData.jam_buka?.trim() || null;
      const jamTutup = configData.jam_tutup?.trim() || null;
      const cfgMax = Number(configData.max_pesanan) || 15;
      setOpeningTimeText(jamBuka?.replace(':', '.') || '10.00');
      setClosingTimeText(jamTutup?.replace(':', '.') || '15.30');
      setMaxOrders(cfgMax);
      
      // Process orders
      const today = new Date();
      const orderCount = Array.isArray(ordersData) ? ordersData.filter((row: any) => {
        if (!row?.no_order || !row?.waktu) return false;
        const t = new Date(row.waktu);
        return t.getFullYear() === today.getFullYear() && t.getMonth() === today.getMonth() && t.getDate() === today.getDate();
      }).length : 0;
      
      // Set store status
      const status = getDynamicStatus({ jamBuka, jamTutup, maxOrders: cfgMax }, orderCount);
      setIsStoreOpen(status.isOpen);
      setStatusReason(status.reason);
    } catch (e) {
      console.error("Error fetching config/orders:", e);
      setIsStoreOpen(false);
      setStatusReason('Gagal memuat status outlet.');
    }
  }, [getDynamicStatus]);

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbxEVHfzLO5ghRZg-f5A2KsYROBALRqTcAPQQ9nxX2tmU1KEaZWisoYyvJA19RPRu8Kf/exec?api=stock');
      const data = await res.json();
      if (Array.isArray(data)) setStock(data);
    } catch (e) {
      console.error("Error fetching stock:", e);
    }
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  useEffect(() => {
    const loadInitialData = async () => {
      setPageIsLoading(true);
      await Promise.all([
          fetchConfigAndOrders(),
          fetchStock()
      ]);
      setPageIsLoading(false);
    };
    loadInitialData();
  }, [fetchConfigAndOrders, fetchStock]);

  return (
    <>
      <LoadingScreen isLoading={pageIsLoading} />
      <div style={{ display: pageIsLoading ? 'none' : 'block' }}>
        <OrderingPage
          name={name}
          setName={setName}
          note={note}
          setNote={setNote}
          total={total}
          calcDetails={calcDetails}
          showCalcResult={showCalcResult}
          alert={alert}
          setAlert={setAlert}
          isStoreOpen={isStoreOpen}
          statusReason={statusReason}
          openingTimeText={openingTimeText}
          closingTimeText={closingTimeText}
          stock={stock}
          orderItems={orderItems}
          calculateTotal={calculateTotal}
          handleOpenConfirm={handleOpenConfirm}
          handleModalSubmit={handleModalSubmit}
          handleAddOrUpdateItem={handleAddOrUpdateItem}
          isSubmitting={isSubmitting}
          whatsappUrl={whatsappUrl}
          whatsappMessage={whatsappMessage}
          priceMap={priceMap}
        />
      </div>
    </>
  );
}
