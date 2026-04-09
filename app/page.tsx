'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderingPage from './components/OrderingPage';
import LoadingScreen from './components/LoadingScreen';
import { API_URLS } from './lib/api-config';
import { DEVELOPER_MODE, CLOSED_PAGE_STATUS } from './lib/settings';
import { StockItem, OrderItem, AlertMessage } from './components/OrderingPage'; // Import interfaces

const priceMap: { [key: string]: number } = {
  'PKT PA': 16000, 'PKT PB': 16000, 'PKT DD': 16000, 'PKT SY': 16000, 'PKT ATI': 14000,
  'PKT KL': 14000, 'PKT TD': 12000, 'PKT TT': 12000, 'NP PA': 12000, 'NP PB': 12000,
  'NP DD': 12000, 'NP SY': 12000, 'NP TD': 8000, 'NP ATI': 10000, 'NP KL': 10000, 'EXT NDJ': 6000, 'EXT NSP': 5000, 'EXT SI': 4000, 'EXT SB': 4000, 'EXT TP': 1000,
  'PKT PA NDJ': 18000, 'PKT PB NDJ': 18000, 'PKT DD NDJ': 18000, 'PKT SY NDJ': 18000,
  'PKT ATI NDJ': 16000, 'PKT KL NDJ': 16000, 'PKT TD NDJ': 14000, 'PKT TT NDJ': 14000,
  'EXT TH': 1000, 'EXT JK': 5000, 'EXT TG': 4000, 'EXT KG': 4000, 
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
  const [baseMessage, setBaseMessage] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [currentOrderTotal, setCurrentOrderTotal] = useState<number>(0);

  useEffect(() => {
    if (DEVELOPER_MODE) {
      return; // Abaikan redirect jika mode development aktif
    }

    // Hanya redirect ke /closed jika waktunya 00.00 DAN halaman closed statusnya 'on'
    if (CLOSED_PAGE_STATUS === 'on' && openingTimeText === '00.00' && closingTimeText === '00.00') {
      setIsRedirecting(true);
      window.location.href = '/closed';
    }
  }, [openingTimeText, closingTimeText, CLOSED_PAGE_STATUS]);

  // Restore order state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedOrderData = localStorage.getItem('jukut_last_order');
    if (savedOrderData) {
      try {
        const data = JSON.parse(savedOrderData);
        setName(data.name || '');
        setNote(data.note || '');
        setOrderItems(data.orderItems || []);
        setTotal(data.total || 0);
        setCurrentOrderNumber(data.currentOrderNumber || '');
        setCurrentOrderTotal(data.currentOrderTotal || 0);
        setWhatsappMessage(data.whatsappMessage || '');
        setWhatsappUrl(data.whatsappUrl || '');
        setBaseMessage(data.baseMessage || '');
        setPaymentProofUrl(data.paymentProofUrl || '');
        console.log('Restored order data from localStorage');
      } catch (e) {
        console.error('Failed to restore order data:', e);
      }
    }
  }, []);

  // Save order state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only save if there's actual order data
    if (currentOrderNumber || whatsappMessage) {
      const orderData = {
        name,
        note,
        orderItems,
        total,
        currentOrderNumber,
        currentOrderTotal,
        whatsappMessage,
        whatsappUrl,
        baseMessage,
        paymentProofUrl,
      };
      localStorage.setItem('jukut_last_order', JSON.stringify(orderData));
    }
  }, [name, note, orderItems, total, currentOrderNumber, currentOrderTotal, whatsappMessage, whatsappUrl, baseMessage, paymentProofUrl]);

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
      const res = await fetch(API_URLS.GET_NEXT_ORDER_ID);
      const data = await res.json();

      if (data.no_order) {
        console.log(`✅ Order ID generated: ${data.no_order}`);
        return data.no_order;
      }

      console.warn('Unexpected response from getNextOrderId:', data);
      return `ORD-ERR-${Date.now().toString().slice(-5)}`;

    } catch (e) {
      console.error('unable to fetch order ID', e);
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
      setCurrentOrderNumber(orderNumber);

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
      waMessage += `total ${total.toLocaleString('id-ID')}\n\nPembayaran QRIS\n\n`;

      // Store base message untuk digabung dengan bukti pembayaran nanti
      setBaseMessage(waMessage);
      // Kosongkan message dan url sampai pembayaran dikonfirmasi
      setWhatsappMessage('');
      setWhatsappUrl('');

      // Store order total before resetting (for payment verification later)
      setCurrentOrderTotal(total);

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
    if (DEVELOPER_MODE) {
      return { isOpen: true, reason: 'MODE DEV: Jam pemesanan diabaikan.' };
    }
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
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching config/orders attempt ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const [configRes, ordersRes] = await Promise.all([
          fetch(API_URLS.CONFIG, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          }),
          fetch(API_URLS.ORDERS, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          })
        ]);
        
        clearTimeout(timeoutId);
        
        if (!configRes.ok || !ordersRes.ok) {
          throw new Error(`HTTP Error - Config: ${configRes.status}, Orders: ${ordersRes.status}`);
        }
        
        const configData = await configRes.json();
        const ordersData = await ordersRes.json();
        
        console.log('Config/orders data fetched successfully');

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
        
        return; // Success - exit retry loop
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Config/orders fetch attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('All config/orders fetch attempts failed:', lastError?.message);
          
          // Provide more specific error messages based on error type
          if (lastError?.message?.includes('403')) {
            setStatusReason('API tidak dapat diakses (403 Forbidden). Google Apps Script perlu di-deploy ulang. Silakan hubungi administrator.');
          } else if (lastError?.message?.includes('404')) {
            setStatusReason('API tidak ditemukan (404). URL deployment mungkin berubah. Silakan hubungi administrator.');
          } else if (lastError?.name === 'AbortError') {
            setStatusReason('Koneksi timeout. Server Google Apps Script mungkin sedang sibuk. Silakan coba lagi dalam beberapa menit.');
          } else if (lastError?.message?.includes('NetworkError') || lastError?.message?.includes('fetch')) {
            setStatusReason('Tidak dapat terhubung ke server Google Apps Script. Kemungkinan: 1) Script perlu di-deploy ulang, 2) Masalah CORS, atau 3) Koneksi internet bermasalah.');
          } else if (lastError?.message?.includes('Moved Temporarily') || lastError?.message?.includes('302')) {
            setStatusReason('Google Apps Script deployment sudah kadaluarsa. Script perlu di-deploy ulang dengan URL baru.');
          } else {
            setStatusReason('Gagal memuat status outlet. Google Apps Script mungkin perlu di-deploy ulang. Silakan hubungi administrator.');
          }
          
          setIsStoreOpen(false);
          break;
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying config/orders fetch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [getDynamicStatus]);

  const fetchStock = useCallback(async () => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching stock attempt ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const res = await fetch(API_URLS.STOCK, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Stock data fetched successfully:', data);
        
        if (Array.isArray(data)) {
          setStock(data);
          return; // Success - exit retry loop
        } else {
          throw new Error('Invalid data format received');
        }
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Stock fetch attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, log the final error and set fallback stock
        if (attempt === maxRetries) {
          console.error('All stock fetch attempts failed:', lastError?.message);
          
          // Provide more specific error handling for stock fetch
          if (lastError?.message?.includes('403')) {
            console.warn('Stock API access forbidden - using empty stock data');
          } else if (lastError?.message?.includes('404')) {
            console.warn('Stock API not found - using empty stock data');
          } else if (lastError?.name === 'AbortError') {
            console.warn('Stock fetch timeout - using empty stock data');
          } else if (lastError?.message?.includes('NetworkError') || lastError?.message?.includes('fetch')) {
            console.warn('Network error fetching stock - using empty stock data');
          }
          
          // Set empty stock array as fallback to prevent app crash
          setStock([]);
          break;
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying stock fetch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  useEffect(() => {
    const loadInitialData = async () => {
      // setPageIsLoading(true); // Tidak perlu karena default state sudah true
      await Promise.all([
          fetchConfigAndOrders(),
          fetchStock()
      ]);
      setPageIsLoading(false);
    };
    loadInitialData();
  }, []); // Dependency kosong agar hanya jalan sekali saat mount

  // Set up polling for stock updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStock();
    }, 30000); // Poll every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchStock]);

  const isNdjOutOfStock = stock.find(item => item.nama_item === 'Nasi Daun Jeruk')?.stok === 0;

  return (
    <>
      <LoadingScreen isLoading={pageIsLoading || isRedirecting} />
      <div style={{ display: pageIsLoading || isRedirecting ? 'none' : 'block' }}>
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
          baseMessage={baseMessage}
          priceMap={priceMap}
          isNdjOutOfStock={isNdjOutOfStock}
          noOrder={currentOrderNumber}
          currentOrderTotal={currentOrderTotal}
          onPaymentConfirmed={(cloudinaryUrl?: string) => {
            // Gabungkan baseMessage dengan bukti pembayaran menggunakan payment-proof page
            if (cloudinaryUrl) {
              setPaymentProofUrl(cloudinaryUrl);
              // Buat link ke payment-proof page dengan Open Graph meta tags
              const paymentProofLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment-proof?url=${encodeURIComponent(cloudinaryUrl)}&order=${currentOrderNumber}`;
              // Buat message final dengan link ke payment-proof (akan jadi thumbnail di WhatsApp)
              const finalMessage = `${baseMessage}Bukti Pembayaran : ${paymentProofLink}`;
              const waUrl = `https://wa.me/62882007448066?text=${encodeURIComponent(finalMessage)}`;
              
              setWhatsappMessage(finalMessage);
              setWhatsappUrl(waUrl);
              console.log('Payment confirmed with proof:', cloudinaryUrl);
              console.log('Payment proof link:', paymentProofLink);
            } else {
              console.log('Payment confirmed for order:', currentOrderNumber);
            }
          }}
        />
      </div>
    </>
  );
}
