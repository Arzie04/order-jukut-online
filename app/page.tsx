'use client';

import { useState, useEffect, useCallback } from 'react';
import OrderingPage from './components/OrderingPage';
import LoadingScreen from './components/LoadingScreen';
import { API_URLS } from './lib/api-config';
import { DEVELOPER_MODE, CLOSED_PAGE_STATUS } from './lib/settings';
import { devError, devLog, devWarn } from './lib/logger';
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

const REGULAR_PACKAGE_DEPENDENCIES = ['NASI PUTIH', 'JUKUT', 'SAMBAL IJO'] as const;
const NDJ_PACKAGE_DEPENDENCIES = ['NASI DAUN JERUK', 'JUKUT', 'SAMBAL IJO'] as const;

type PackageVariant = 'SI' | 'SB';

function parseOrderCode(code: string) {
  const parts = code.trim().split(/\s+/);
  const prefix = parts[0];
  const isPackage = prefix === 'PKT' && parts.length >= 2;
  const isNonPackage = prefix === 'NP' && parts.length >= 2;

  // A variant can exist if it's a PKT or NP item
  const hasSbVariant = (isPackage || isNonPackage) && parts[parts.length - 1] === 'SB';
  const baseParts = hasSbVariant ? parts.slice(0, -1) : parts;

  return {
    isPackage,
    baseCode: baseParts.join(' '),
    itemCode: baseParts[1] || '',
    isNdj: baseParts.includes('NDJ'),
    variant: hasSbVariant ? 'SB' as PackageVariant : 'SI' as PackageVariant,
  };
}

function getItemPrice(code: string) {
  if (priceMap[code] != null) {
    return priceMap[code];
  }

  const { baseCode } = parseOrderCode(code);
  return priceMap[baseCode] || 0;
}

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
        devLog('Restored order data from localStorage');
      } catch (e) {
        devError('Failed to restore order data:', e);
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
      const updatedItems = [...currentItems];

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

  const handleMovePackageVariant = (code: string, targetVariant: PackageVariant) => {
    setOrderItems(currentItems => {
      const sourceIndex = currentItems.findIndex(item => item.code === code);
      if (sourceIndex === -1) {
        return currentItems;
      }

      const parsedCode = parseOrderCode(code);
      if (!parsedCode.isPackage || parsedCode.variant === targetVariant) {
        return currentItems;
      }

      const updatedItems = [...currentItems];
      const sourceItem = updatedItems[sourceIndex];
      const targetCode = targetVariant === 'SB' ? `${parsedCode.baseCode} SB` : parsedCode.baseCode;

      if (sourceItem.qty <= 1) {
        updatedItems.splice(sourceIndex, 1);
      } else {
        updatedItems[sourceIndex] = {
          ...sourceItem,
          qty: sourceItem.qty - 1,
        };
      }

      const targetIndex = updatedItems.findIndex(item => item.code === targetCode);
      if (targetIndex > -1) {
        updatedItems[targetIndex] = {
          ...updatedItems[targetIndex],
          qty: updatedItems[targetIndex].qty + 1,
        };
      } else {
        updatedItems.splice(sourceIndex + 1, 0, {
          code: targetCode,
          qty: 1,
        });
      }

      const newOrderString = updatedItems.map(item => `${item.code} ${item.qty}`).join('\\n');
      setOrder(newOrderString);
      setShowCalcResult(false);
      return updatedItems.filter(item => item.qty > 0);
    });
  };

  const calculateTotal = useCallback(() => {
    if (orderItems.length === 0) {
      setShowCalcResult(false); setCalcDetails(''); return false;
    }
    let totalAmount = 0;
    const details: string[] = [];
    orderItems.forEach(({ code, qty }) => {
      const price = getItemPrice(code);
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
  
  const getConsumedStockNames = (code: string): string[] => {
    const parsedCode = parseOrderCode(code);
    const prefix = code.trim().split(' ')[0];
    const itemCode = parsedCode.itemCode;
    const consumes: string[] = [];

    if (itemCode === 'TT') {
      consumes.push('TAHU', 'TEMPE');
    } else if (itemCodeToNameMap[itemCode]) {
      consumes.push(itemCodeToNameMap[itemCode]);
    }

    // For PKT, add rice and jukut.
    if (prefix === 'PKT') {
        const rice = parsedCode.isNdj ? 'NASI DAUN JERUK' : 'NASI PUTIH';
        consumes.push(rice, 'JUKUT');
    }
    // For NP, add only jukut.
    else if (prefix === 'NP') {
        consumes.push('JUKUT');
    }

    // For both PKT and NP, add the sambal variant.
    if (prefix === 'PKT' || prefix === 'NP') {
        consumes.push(parsedCode.variant === 'SB' ? 'SAMBAL BAWANG' : 'SAMBAL IJO');
    }

    return consumes;
  };

  const getOrderQuantities = () => {
    const quantities: { [key: string]: number } = {};
    const addQuantity = (itemName: string, qty: number) => {
      quantities[itemName] = (quantities[itemName] || 0) + qty;
    };

    for (const item of orderItems) {
      for (const itemName of getConsumedStockNames(item.code)) {
        addQuantity(itemName, item.qty);
      }
    }
    return quantities;
  };

  const handleOpenConfirm = (): boolean => {
    if (!name.trim() || orderItems.length === 0) {
      setAlert({ 
        type: 'danger', 
        message: 'Nama dan pesanan wajib diisi.\n\nJika ada masalah, hubungi admin!' 
      }); 
      return false;
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
        const consumes = getConsumedStockNames(item.code);

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
      setAlert({ 
        type: 'danger', 
        message: 'Terjadi kesalahan saat menghitung total. Silakan refresh halaman dan coba lagi.' 
      }); 
      return false;
    }
    return true;
  };

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    setAlert(null);

    const orderString = orderItems.map(item => `${item.code} ${item.qty}`).join('\n');

    try {
      // Step 1: Create order on backend so number generation and insert
      // happen in one locked operation.
      devLog('[ORDER] Creating order via insert-order API...');
      
      const orderInsertResponse = await fetch(API_URLS.INSERT_ORDER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: name,
          pesanan: orderString,
          note,
          total,
        })
      });

      const orderInsertResult = await orderInsertResponse.json();
      const orderNumber = orderInsertResult.no_order;

      if (!orderInsertResponse.ok || !orderInsertResult.success || !orderNumber) {
        throw new Error(orderInsertResult?.error || 'Gagal membuat pesanan');
      }

      devLog('[ORDER] Order created with number:', orderNumber);
      setCurrentOrderNumber(orderNumber);

      // Step 2: Order sudah tersimpan. Lanjut background stock update.
      
      /*
      // Legacy client-side Google Form submission kept only for reference.
      // Get field entry IDs from environment
      const namaField = process.env.NEXT_PUBLIC_FORM_FIELD_NAMA;
      const pesananField = process.env.NEXT_PUBLIC_FORM_FIELD_PESANAN;
      const noteField = process.env.NEXT_PUBLIC_FORM_FIELD_NOTE;
      const totalField = process.env.NEXT_PUBLIC_FORM_FIELD_TOTAL;
      const noOrderField = process.env.NEXT_PUBLIC_FORM_FIELD_NO_ORDER;
      
      console.log('[FORM] Entry IDs configured:', {
        nama: namaField,
        pesanan: pesananField,
        note: noteField,
        total: totalField,
        noOrder: noOrderField
      });
      
      // Append form fields - only if they're configured
      if (namaField) {
        formData.append(namaField, name);
        console.log(`[FORM] Added NAMA: ${name}`);
      }
      if (pesananField) {
        formData.append(pesananField, orderString);
        console.log(`[FORM] Added PESANAN (${pesananField}): ${orderString.substring(0, 50)}...`);
      }
      if (noteField) {
        formData.append(noteField, note);
        console.log(`[FORM] Added NOTE: ${note}`);
      }
      if (totalField) {
        formData.append(totalField, total.toString());
        console.log(`[FORM] Added TOTAL (${totalField}): ${total}`);
      }
      if (noOrderField) {
        formData.append(noOrderField, orderNumber);
        console.log(`[FORM] Added NO_ORDER (${noOrderField}): ${orderNumber}`);
      }
      
      const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
      console.log('[FORM] Form URL:', formUrl);
      
      if (!formUrl) {
        console.error('[FORM] ❌ ERROR: Google Form URL not configured!');
        throw new Error('Google Form URL tidak dikonfigurasi di .env.local');
      }
      
      try {
        console.log('[FORM] 📤 Sending fetch request to Google Form...');
        // Submit to Google Form with no-cors mode (silent submission)
        const fetchResponse = await fetch(formUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData
        });
        
        console.log('[FORM] ✓ Fetch request completed (no-cors ignore response)');
        console.log('[FORM] ✓ Google Form submission sent silently');
      } catch (formError) {
        // Still continue even if form submission fails
        console.error('[FORM] ⚠️ Form submission had error (but continuing):', formError);
      } finally {
        console.log('[FORM] Data harus sudah masuk ke Google Form responses');
      }
      */

      // Step 3: Update Stock via API (Background Process)
      const quantities = getOrderQuantities();
      const stockUpdates = Object.entries(quantities).map(([nama_item, qty]) => ({
        nama_item,
        quantity: qty
      }));

      devLog('[STOCK] Sending stock updates...', JSON.stringify(stockUpdates));

      if (stockUpdates.length > 0) {
        fetch(API_URLS.UPDATE_STOCK, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ updates: stockUpdates })
        }).catch(e => devError('Gagal update stok:', e));
      }

      // Step 4: Construct the final WhatsApp message
      const now = new Date();
      const timeString = `${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;

      const orderDetailsString = orderItems.map(item => {
          const price = getItemPrice(item.code);
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
        message: `Pesanan Anda (${orderNumber}) berhasil dibuat! Silakan simpan bukti transaksi QRIS dan kirimkan via WhatsApp Bersama Pesan ini.`
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
      devError('[ORDER] Submission Error:', error);
      setAlert({
        type: 'danger',
        message: `❌ Terjadi kesalahan saat membuat pesanan: ${error.message}\n\nSilakan coba lagi atau hubungi admin.`
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
        devLog(`Fetching config/orders attempt ${attempt}/${maxRetries}`);
        
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
        
        devLog('Config/orders data fetched successfully');

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
        devError(`Config/orders fetch attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          devError('All config/orders fetch attempts failed:', lastError?.message);
          
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
        devLog(`Retrying config/orders fetch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [getDynamicStatus]);

  const fetchStock = useCallback(async () => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        devLog(`Fetching stock attempt ${attempt}/${maxRetries}`);
        
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
        devLog('Stock data fetched successfully:', data);
        
        if (Array.isArray(data)) {
          setStock(data);
          return; // Success - exit retry loop
        } else {
          throw new Error('Invalid data format received');
        }
        
      } catch (error) {
        lastError = error as Error;
        devError(`Stock fetch attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, log the final error and set fallback stock
        if (attempt === maxRetries) {
          devError('All stock fetch attempts failed:', lastError?.message);
          
          // Provide more specific error handling for stock fetch
          if (lastError?.message?.includes('403')) {
            devWarn('Stock API access forbidden - using empty stock data');
          } else if (lastError?.message?.includes('404')) {
            devWarn('Stock API not found - using empty stock data');
          } else if (lastError?.name === 'AbortError') {
            devWarn('Stock fetch timeout - using empty stock data');
          } else if (lastError?.message?.includes('NetworkError') || lastError?.message?.includes('fetch')) {
            devWarn('Network error fetching stock - using empty stock data');
          }
          
          // Set empty stock array as fallback to prevent app crash
          setStock([]);
          break;
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        devLog(`Retrying stock fetch in ${delay}ms...`);
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

  const getStockAmount = (itemName: string): number | undefined => {
    return stock.find(item => item.nama_item.toUpperCase() === itemName.toUpperCase())?.stok;
  };

  const isPackageOutOfStock = REGULAR_PACKAGE_DEPENDENCIES.some(itemName => getStockAmount(itemName) === 0);
  const isNdjOutOfStock = NDJ_PACKAGE_DEPENDENCIES.some(itemName => getStockAmount(itemName) === 0);

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
          handleMovePackageVariant={handleMovePackageVariant}
          isSubmitting={isSubmitting}
          whatsappUrl={whatsappUrl}
          whatsappMessage={whatsappMessage}
          baseMessage={baseMessage}
          priceMap={priceMap}
          isPackageOutOfStock={isPackageOutOfStock}
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
              devLog('Payment confirmed with proof:', cloudinaryUrl);
              devLog('Payment proof link:', paymentProofLink);
            } else {
              devLog('Payment confirmed for order:', currentOrderNumber);
            }
          }}
        />
      </div>
    </>
  );
}
