/* =========================
   TIMEZONE HELPER (for Indonesia WIB = UTC+7)
   ========================= */
function getNowInWIB() {
  // Get current time and adjust for WIB (UTC+7)
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const wibTime = new Date(utcTime + (7 * 60 * 60 * 1000)); // UTC+7
  return wibTime;
}

function getTodayDateWIB() {
  // Get today's date in WIB timezone
  const wibTime = getNowInWIB();
  return {
    year: wibTime.getFullYear(),
    month: wibTime.getMonth(),
    date: wibTime.getDate()
  };
}

function formatTimeToWIB(dateObj) {
  // Convert any date object to WIB readable format
  if (!dateObj || !(dateObj instanceof Date)) {
    return '';
  }
  
  // Adjust to WIB (UTC+7)
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60 * 1000);
  const wibDate = new Date(utcTime + (7 * 60 * 60 * 1000));
  
  // Format: DD/MM/YYYY HH:MM:SS
  const dd = String(wibDate.getDate()).padStart(2, '0');
  const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
  const yyyy = wibDate.getFullYear();
  const hh = String(wibDate.getHours()).padStart(2, '0');
  const min = String(wibDate.getMinutes()).padStart(2, '0');
  const ss = String(wibDate.getSeconds()).padStart(2, '0');
  
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

/* =========================
   MAIN ENTRY POINT (doGet)
   See: SCRIPT_ENDPOINTS_REFERENCE.md
========================= */
function doGet(e) {
  const api = e.parameter.api || "orders";

  if (api === "orders") return getOrders(); // SC-A1
  if (api === "orderItemCount") return getOrderItemCount(); // SC-A2
  if (api === "stock") return getStock(); // SC-A3
  if (api === "config") return getConfig(); // SC-A4
  if (api === "getNextOrderId") return getNextOrderIdApi(); // SC-A5
  if (api === "deleteOlderThan") {
    const days = parseInt(e.parameter.days) || 7;
    return deleteOlderThanDays(days); // SC-A6
  }
  if (api === "deleteByStatus") {
    const status = e.parameter.status || "dibatalkan";
    return deleteByStatus(status); // SC-A7
  }
  if (api === "updateStatus") {
    return updateOrderStatus(e.parameter.no_order, e.parameter.status); // SC-A8
  }
  if (api === "deleteOrder") {
    const no_order = e.parameter.no_order;
    return deleteOrder(no_order); // SC-A9
  }

  return jsonOutput({ error: "API tidak ditemukan" });
}

/* =========================
   ORDERS (Sheet 1)
========================= */

function getOrders() {
  try {
    console.log('📋 getOrders called');
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      console.error('❌ Sheet "Form Responses 1" not found');
      return jsonOutput({ error: "Sheet tidak ditemukan", success: false });
    }
    
    const allRows = sheet.getDataRange().getValues();
    console.log(`📊 Total rows (including header): ${allRows.length}`);
    
    if (allRows.length < 2) {
      console.log('ℹ️  No data rows found');
      return jsonOutput([]);
    }
    
    const header = allRows[0];
    console.log(`📊 Header:`, JSON.stringify(header));
    
    // STEP 1: FILTER - Remove completely empty rows first
    console.log('🔍 STEP 1: Filtering empty rows...');
    const nonEmptyRows = allRows.slice(1).filter((row, idx) => {
      // Row is valid only if it has MEANINGFUL data: nama (col 1) OR no_order (col 5)
      const nama = String(row[1] || '').trim();
      const noOrder = String(row[5] || '').trim();
      const hasData = nama !== '' || noOrder !== '';
      
      if (!hasData) {
        console.log(`   ⏭️  Skipping row ${idx}: nama & no_order both empty`);
      }
      return hasData;
    });
    
    console.log(`✅ Found ${nonEmptyRows.length} non-empty rows`);
    
    if (nonEmptyRows.length === 0) {
      console.log('ℹ️  No valid data rows after filtering');
      return jsonOutput([]);
    }

    // STEP 2: OPTIMIZE - Return only latest 100 orders (non-empty)
    console.log('🔍 STEP 2: Getting latest 100 orders...');
    const latestNonEmptyRows = nonEmptyRows.slice(-100);
    console.log(`✅ Returning latest ${latestNonEmptyRows.length} orders`);

    // STEP 3: MAP - Convert to structured data
    console.log('🔍 STEP 3: Mapping data...');
    const data = latestNonEmptyRows.map((row, idx) => {
      // Ensure row has enough columns
      while (row.length < 10) {
        row.push('');
      }
      
      // Convert waktu to WIB format if it's a Date object
      let waktuDisplay = '';
      if (row[0] instanceof Date) {
        waktuDisplay = formatTimeToWIB(row[0]);
      } else {
        waktuDisplay = row[0] || '';
      }
      
      const item = {
        waktu: waktuDisplay,
        nama: row[1] || '',
        pesanan: row[2] || '',
        note: row[3] || '',
        total: row[4] || 0,
        no_order: row[5] || '',
        paid: row[6] === true || row[6] === 'TRUE' || String(row[6]).toLowerCase() === 'true',
        status: row[8] || "terbaru"
      };
      
      if (idx < 5) {
        console.log(`   📦 Row ${idx}:`, JSON.stringify(item));
      }
      
      return item;
    });
    
    console.log(`\n✅ Successfully returned ${data.length} orders`);
    return jsonOutput(data);
    
  } catch (e) {
    console.error('❌ Error in getOrders:', e.toString());
    console.error('Stack:', e);
    return jsonOutput({ error: e.toString(), success: false });
  }
}

/* =========================
   GET NEXT ORDER ID (For Order Numbering - NO LIMITS)
   Ini dipanggil khusus untuk generate nomor order, jadi fetch ALL rows
========================= */
function getNextOrderIdApi() {
  try {
    console.log('📘 getNextOrderIdApi called');
    
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      console.error('❌ Sheet Form Responses 1 not found');
      throw new Error("Sheet 'Form Responses 1' tidak ditemukan");
    }
    
    const data = sheet.getDataRange().getValues();
    console.log(`📊 Total rows in sheet: ${data.length}`);
    
    if (data.length < 2) {
      console.log('ℹ️  Sheet is empty or only has header, returning ORD-0001');
      return jsonOutput({ no_order: "ORD-0001" });
    }
    
    const rows = data.slice(1); // Skip header
    console.log(`📊 Processing ${rows.length} rows`);

    // NO LIMITS: Get ALL orders to find today's count
    const todayWIB = getTodayDateWIB();
    const y = todayWIB.year;
    const m = todayWIB.month;
    const d = todayWIB.date;
    
    console.log(`🗓️  Looking for orders from: ${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')} (WIB)`);

    const todaysOrders = rows.filter((row, idx) => {
      if (!row || row.length === 0) {
        console.log(`⚠️  Row ${idx}: empty or null`);
        return false;
      }
      
      const waktu = row[0];
      const noOrder = row[5];
      
      if (!waktu || !noOrder) {
        return false;
      }
      
      try {
        const t = new Date(waktu);
        if (isNaN(t.getTime())) {
          console.log(`⚠️  Row ${idx}: invalid date`);
          return false;
        }
        
        const isTodaysOrder = t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
        if (isTodaysOrder) {
          console.log(`✅ Row ${idx}: TODAY order found - ${noOrder}`);
        }
        return isTodaysOrder;
      } catch (e) {
        console.log(`⚠️  Row ${idx}: error parsing date - ${e.toString()}`);
        return false;
      }
    });

    console.log(`🎯 Total today's orders found: ${todaysOrders.length}`);

    if (todaysOrders.length === 0) {
      console.log('ℹ️  No orders today, returning ORD-0001');
      return jsonOutput({ no_order: "ORD-0001" });
    }

    // Find max number from today
    let maxNum = 0;
    todaysOrders.forEach((row, idx) => {
      const noOrder = row[5];
      if (noOrder && typeof noOrder === 'string' && noOrder.startsWith('ORD-')) {
        const num = parseInt(noOrder.replace('ORD-', ''), 10);
        if (!isNaN(num)) {
          console.log(`ℹ️  Order ${idx}: ${noOrder} → number ${num}`);
          if (num > maxNum) maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    const result = `ORD-${nextNum.toString().padStart(4, '0')}`;
    console.log(`✅ Next order ID: ${result}`);
    return jsonOutput({ no_order: result });

  } catch (error) {
    console.error('❌ Error in getNextOrderIdApi:', error.toString());
    console.error('Stack:', error);
    
    return jsonOutput({ 
      no_order: `ORD-ERR-${Date.now().toString().slice(-5)}`,
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

/* =========================
   DELETE OLDER THAN X DAYS (SC-A6)
   See: SCRIPT_ENDPOINTS_REFERENCE.md
========================= */
function deleteOlderThanDays(days) {
  try {
    console.log(`🧹 Starting deleteOlderThanDays(${days} days)`);
    
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      return jsonOutput({ 
        success: false, 
        message: "Sheet 'Form Responses 1' tidak ditemukan" 
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const nowWIB = getNowInWIB();
    const threshold = new Date(nowWIB.getTime() - (days * 24 * 60 * 60 * 1000));
    const rowsToDelete = [];
    
    console.log(`📊 Total rows: ${data.length - 1} (excluding header)`);
    console.log(`🗓️  Threshold date (WIB): ${threshold.toISOString()}`);
    
    for (let i = data.length - 1; i > 0; i--) {
      const waktu = data[i][0]; // Column A: timestamp
      if (waktu && waktu instanceof Date) {
        if (waktu < threshold) {
          rowsToDelete.push(i);
        }
      }
    }
    
    console.log(`📋 Found ${rowsToDelete.length} rows to delete`);
    
    let deletedCount = 0;
    for (const rowIndex of rowsToDelete) {
      sheet.deleteRow(rowIndex + 1);
      deletedCount++;
    }
    
    console.log(`✅ Deleted ${deletedCount} rows older than ${days} days`);
    
    return jsonOutput({
      success: true,
      message: `${deletedCount} baris yang lebih dari ${days} hari telah dihapus`,
      deletedRows: deletedCount,
      threshold: threshold.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in deleteOlderThanDays:', error);
    return jsonOutput({
      success: false,
      error: error.toString()
    });
  }
}

/* =========================
   DELETE BY STATUS (SC-A7)
   See: SCRIPT_ENDPOINTS_REFERENCE.md
========================= */
function deleteByStatus(status) {
  try {
    console.log(`🧹 Starting deleteByStatus("${status}")`);
    
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      return jsonOutput({ 
        success: false, 
        message: "Sheet 'Form Responses 1' tidak ditemukan" 
      });
    }
    
    const data = sheet.getDataRange().getValues();
    const statusUpper = String(status).trim().toUpperCase();
    const rowsToDelete = [];
    
    console.log(`📊 Total rows: ${data.length - 1} (excluding header)`);
    console.log(`🏷️  Looking for status: "${statusUpper}"`);
    
    for (let i = data.length - 1; i > 0; i--) {
      const rowStatus = data[i][8]; // Column I (index 8): Status Pesanan
      if (rowStatus && String(rowStatus).trim().toUpperCase() === statusUpper) {
        rowsToDelete.push(i);
      }
    }
    
    console.log(`📋 Found ${rowsToDelete.length} rows with status "${statusUpper}"`);
    
    let deletedCount = 0;
    for (const rowIndex of rowsToDelete) {
      sheet.deleteRow(rowIndex + 1);
      deletedCount++;
    }
    
    console.log(`✅ Deleted ${deletedCount} rows with status "${statusUpper}"`);
    
    return jsonOutput({
      success: true,
      message: `${deletedCount} baris dengan status "${status}" telah dihapus`,
      deletedRows: deletedCount,
      status: status
    });
    
  } catch (error) {
    console.error('❌ Error in deleteByStatus:', error);
    return jsonOutput({
      success: false,
      error: error.toString()
    });
  }
}

/* =========================
   FUNGSI UPDATE STATUS (Sinkronisasi)
========================= */
function updateOrderStatus(noOrder, newStatus) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
  const data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]) === String(noOrder)) {
      sheet.getRange(i + 1, 9).setValue(newStatus); 
      return jsonOutput({ success: true, message: "Status diperbarui ke " + newStatus });
    }
  }
  return jsonOutput({ success: false, message: "No Order tidak ditemukan" });
}

/* =========================
   DELETE ORDER BY NO_ORDER (SC-A9 - NEW)
   Endpoint untuk menghapus pesanan spesifik berdasarkan nomor order
   ========================= */
function deleteOrder(noOrder) {
  try {
    console.log(`🗑️  Processing DELETE_ORDER for: ${noOrder}`);
    
    // VALIDATION: Check if noOrder is provided
    if (!noOrder || String(noOrder).trim() === '') {
      console.error('❌ VALIDATION FAILED: noOrder is empty');
      return jsonOutput({ 
        success: false, 
        error: "Nomor pesanan tidak boleh kosong"
      });
    }
    
    const noOrderTrim = String(noOrder).trim();
    
    // Get sheet
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      console.error('❌ Sheet "Form Responses 1" not found');
      return jsonOutput({ 
        success: false, 
        error: "Sheet tidak ditemukan"
      });
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    let foundRow = -1;
    let orderDetails = null;
    
    console.log(`📊 Searching for order: ${noOrderTrim} in ${data.length - 1} rows`);
    
    // Search for matching no_order
    for (let i = 1; i < data.length; i++) {
      const rowNoOrder = String(data[i][5] || '').trim();
      
      if (rowNoOrder === noOrderTrim) {
        foundRow = i;
        // Store order details for logging
        orderDetails = {
          nama: data[i][1] || '',
          pesanan: data[i][2] || '',
          total: data[i][4] || 0
        };
        console.log(`✅ Found order at row ${i + 1}:`, JSON.stringify(orderDetails));
        break;
      }
    }
    
    // Check if order found
    if (foundRow === -1) {
      console.error(`❌ Order not found: ${noOrderTrim}`);
      return jsonOutput({ 
        success: false, 
        error: `Pesanan dengan nomor ${noOrderTrim} tidak ditemukan`,
        no_order: noOrderTrim
      });
    }
    
    // Delete the row
    console.log(`🗑️  Deleting row ${foundRow + 1}...`);
    sheet.deleteRow(foundRow + 1);
    
    console.log(`✅ Order deleted successfully`);
    
    return jsonOutput({
      success: true,
      message: `Pesanan ${noOrderTrim} berhasil dihapus`,
      deleted_order: noOrderTrim,
      deleted_customer: orderDetails.nama,
      deleted_total: orderDetails.total,
      timestamp: getNowInWIB().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in deleteOrder:', error.toString());
    console.error('Stack:', error);
    return jsonOutput({ 
      success: false, 
      error: error.toString()
    });
  }
}

/* =========================
   INSERT NEW ORDER (SC-B0 - NEW)
   Endpoint untuk membuat order baru langsung dari API
   ========================= */
function insertNewOrder(body) {
  try {
    console.log('📝 Processing INSERT_ORDER');
    console.log('   Data received:', JSON.stringify(body));
    
    // VALIDATION: Check required fields
    const nama = String(body.nama || '').trim();
    const pesanan = String(body.pesanan || '').trim();
    const total = body.total;
    
    if (!nama) {
      console.error('❌ VALIDATION FAILED: nama is empty');
      return jsonOutput({ 
        success: false, 
        error: "Nama pelanggan tidak boleh kosong"
      });
    }
    
    if (!pesanan) {
      console.error('❌ VALIDATION FAILED: pesanan is empty');
      return jsonOutput({ 
        success: false, 
        error: "Pesanan tidak boleh kosong"
      });
    }
    
    if (total == null || total <= 0) {
      console.error('❌ VALIDATION FAILED: total invalid');
      return jsonOutput({ 
        success: false, 
        error: "Total harus lebih dari 0"
      });
    }
    
    // Get next order ID
    console.log('📘 Getting next order ID...');
    const nextOrderResponse = getNextOrderIdApi();
    const nextOrderData = JSON.parse(nextOrderResponse.getContent());
    const noOrder = nextOrderData.no_order;
    
    if (!noOrder) {
      console.error('❌ Failed to generate order ID');
      return jsonOutput({ 
        success: false, 
        error: "Gagal generate nomor pesanan"
      });
    }
    
    console.log(`✅ Generated order ID: ${noOrder}`);
    
    // Get sheet
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Form Responses 1");
    
    if (!sheet) {
      console.error('❌ Sheet "Form Responses 1" not found');
      return jsonOutput({ 
        success: false, 
        error: "Sheet tidak ditemukan" 
      });
    }
    
    // Prepare new row data
    const nowWIB = getNowInWIB();
    const note = String(body.note || '').trim();
    const status = body.status || "terbaru";
    
    const newRow = [
      nowWIB,           // Column A: waktu
      nama,             // Column B: nama
      pesanan,          // Column C: pesanan
      note,             // Column D: note
      total,            // Column E: total
      noOrder,          // Column F: no_order (STATIC!)
      false,            // Column G: paid
      '',               // Column H: empty
      status,           // Column I: status
      ''                // Column J: bukti_pembayaran
    ];
    
    console.log('📋 Appending new row:', JSON.stringify(newRow));
    sheet.appendRow(newRow);
    
    console.log('✅ Order inserted successfully at row ' + sheet.getLastRow());
    
    return jsonOutput({
      success: true,
      message: "Pesanan berhasil dibuat",
      no_order: noOrder,
      nama: nama,
      total: total,
      timestamp: nowWIB.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in insertNewOrder:', error.toString());
    console.error('Stack:', error);
    return jsonOutput({ 
      success: false, 
      error: error.toString()
    });
  }
}

/* =========================
   MAIN ENTRY POINT (doPost)
   Update Stok, Konfirmasi Pembayaran, Insert Order
========================= */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return ContentService.createTextOutput("Server Busy");
  }

  try {
    if (!e || !e.postData) return ContentService.createTextOutput("No Data");
    var content = e.postData.contents;
    var body = JSON.parse(content);

    // --- LOGIKA A: INSERT NEW ORDER (BARU) ---
    if (body.type === "INSERT_ORDER") {
      return insertNewOrder(body);
    }

    // --- LOGIKA B: KONFIRMASI PEMBAYARAN ---
    if (body.type === "CONFIRM_PAYMENT") {
      console.log('🔍 Processing CONFIRM_PAYMENT for order:', body.no_order);
      console.log('   Cloudinary URL:', body.cloudinary_url);
      console.log('   Status Paid:', body.status_paid);
      
      // VALIDATION: Check if noOrder is empty/invalid
      if (!body.no_order || String(body.no_order).trim() === '') {
        console.error('❌ VALIDATION FAILED: noOrder is empty or invalid');
        return jsonOutput({ 
          success: false, 
          error: "Nomor pesanan tidak valid atau kosong",
          received_no_order: body.no_order
        });
      }
      
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
      if (!sheet) {
        console.error('❌ Sheet "Form Responses 1" not found');
        return jsonOutput({ success: false, error: "Sheet tidak ditemukan" });
      }
      
      var data = sheet.getDataRange().getValues();
      var found = false;
      var foundRow = -1;

      // STRATEGY 1: Prioritas - Cari match EXACT dari No Order
      console.log('📋 Strategy 1: Searching for exact order number match in all rows...');
      for (var i = 1; i < data.length; i++) {
        var rowNoOrder = String(data[i][5]).trim();
        if (rowNoOrder === String(body.no_order).trim()) {
          console.log('✅ Found exact match at row ' + (i + 1) + ': ' + rowNoOrder);
          foundRow = i;
          found = true;
          break;
        }
      }
      
      // STRATEGY 2: Fallback - Jika tidak ketemu, cari order terbaru dengan nama yang sama
      if (!found) {
        console.log('⚠️  No exact match found, trying Strategy 2: Search by name + recent timestamp...');
        var mostRecentIndex = -1;
        var mostRecentTime = null;
        
        for (var i = 1; i < data.length; i++) {
          var waktu = data[i][0];
          var nama = String(data[i][1]).trim();
          var rowNoOrder = String(data[i][5]).trim();
          
          // Cari row dengan nama benar tapi belum punya order number (empty or berbeda)
          if (nama === String(body.nama || '').trim() && waktu instanceof Date) {
            if (mostRecentTime === null || waktu > mostRecentTime) {
              mostRecentTime = waktu;
              mostRecentIndex = i;
            }
          }
        }
        
        if (mostRecentIndex >= 0) {
          console.log('✅ Found by name+timestamp fallback at row ' + (mostRecentIndex + 1));
          foundRow = mostRecentIndex;
          found = true;
        }
      }
      
      if (found && foundRow >= 0) {
        console.log('✅ Updating row ' + (foundRow + 1) + ' with payment info');
        
        // 1. Update Kolom G (index 6) jadi TRUE jika status_paid true
        if (body.status_paid === true) {
          sheet.getRange(foundRow + 1, 7).setValue(true);
          console.log('   ✅ Updated payment status (Col G) to TRUE');
        }
        
        // 2. Update Kolom J (index 9) dengan Link Cloudinary
        if (body.cloudinary_url) {
          sheet.getRange(foundRow + 1, 10).setValue(body.cloudinary_url);
          console.log('   ✅ Updated cloudinary URL (Col J)');
        }
        
        // 3. BONUS: Jika no_order masih kosong, update Column F juga
        if (!String(data[foundRow][5]).trim()) {
          sheet.getRange(foundRow + 1, 6).setValue(body.no_order);
          console.log('   ✅ Set order number (Col F) to:', body.no_order);
        }
        
        console.log('✅ Payment confirmation successful');
        return jsonOutput({ 
          success: true, 
          message: "Bukti pembayaran berhasil dicatat",
          updated_row: foundRow + 1,
          no_order: body.no_order
        });
      } else {
        console.error('❌ Order not found after all strategies');
        console.log('   Searched for: ' + body.no_order);
        console.log('   Total rows searched: ' + (data.length - 1));
        return jsonOutput({ 
          success: false, 
          message: "Nomor pesanan tidak ditemukan di database. Silakan hubungi admin.",
          no_order_searched: body.no_order,
          total_rows: data.length - 1,
          debug_strategy_tried: "exact_match + fallback_by_name"
        });
      }
    }

    // --- LOGIKA C: UPDATE STOK ---
    if (body.updates) {
      var sheetName = "Stok outlet Cempaka";
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) return ContentService.createTextOutput("Sheet Not Found");

      var data = sheet.getDataRange().getValues();
      var updates = body.updates;

      for (var j = 0; j < updates.length; j++) {
        var item = updates[j];
        var itemName = String(item.nama_item).trim().toUpperCase();
        var qty = parseInt(item.quantity);
        var found = false;
        for (var i = 1; i < data.length; i++) {
          var sheetItem = String(data[i][1]).trim().toUpperCase();
          if (sheetItem === itemName) {
            var currentStock = parseInt(data[i][2]);
            var newStock = currentStock - qty;
            sheet.getRange(i + 1, 3).setValue(newStock);
            var status = "Tersedia";
            if (newStock <= 0) status = "Terjual Habis";
            else if (newStock < 5) status = "Hampir Habis";
            sheet.getRange(i + 1, 4).setValue(status);
            found = true;
            break;
          }
        }
      }
      return ContentService.createTextOutput("Success");
    }

    return ContentService.createTextOutput("No matching action found");
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

/* =========================
   FUNGSI-FUNGSI LAIN
========================= */

function getOrderItemCount() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Form Responses 1");

  const rows = sheet.getDataRange().getValues();
  rows.shift();

  const todayWIB = getTodayDateWIB();
  const y = todayWIB.year;
  const m = todayWIB.month;
  const d = todayWIB.date;

  let totalItemCount = 0;

  const todayOrders = rows.filter(row => {
    const noOrder = row[5];
    if (noOrder === null || noOrder === undefined || String(noOrder).trim() === '') return false;
    const waktu = row[0];
    if (!waktu) return false;
    const t = new Date(waktu);
    if (Number.isNaN(t.getTime())) return false;
    return (t.getFullYear() === y && t.getMonth() === m && t.getDate() === d);
  });

  todayOrders.forEach(row => {
    const pesanan = row[2];
    if (pesanan && typeof pesanan === 'string') {
      const lines = pesanan.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const prefix = parts[0];
          if (prefix === 'PKT' || prefix === 'NP') {
            if (parts.length >= 3) {
              totalItemCount += (parseInt(parts[2], 10) || 1);
            } else {
              totalItemCount += 1;
            }
          }
        }
      });
    }
  });

  const nowWIB = getNowInWIB();
  
  return jsonOutput({
    itemCount: totalItemCount,
    orderCount: todayOrders.length,
    date: nowWIB.toISOString().split('T')[0]
  });
}

function getStock() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Stok outlet Cempaka");

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();

  const data = rows
    .filter(r => r[1])
    .map(row => ({
      id_item: row[0],
      nama_item: row[1],
      stok: row[2],
      status: row[3],
      catatan: row[4]
    }));

  return jsonOutput(data);
}

function getConfig() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Stok outlet Cempaka");

  const [jamBuka, jamTutup, maxPesanan] =
    sheet.getRange("F2:H2").getValues()[0];

  return jsonOutput({
    jam_buka: jamBuka ? String(jamBuka).trim() : null,
    jam_tutup: jamTutup ? String(jamTutup).trim() : null,
    max_pesanan: maxPesanan || 0,
    status_buka: false 
  });
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}