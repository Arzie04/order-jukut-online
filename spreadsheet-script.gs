/* =========================
   MAIN ENTRY POINT (doGet)
========================= */
function doGet(e) {
  const api = e.parameter.api || "orders";

  if (api === "orders") return getOrders();
  if (api === "orderItemCount") return getOrderItemCount();
  if (api === "stock") return getStock();
  if (api === "config") return getConfig();
  
  if (api === "updateStatus") {
    return updateOrderStatus(e.parameter.no_order, e.parameter.status);
  }

  return jsonOutput({ error: "API tidak ditemukan" });
}

/* =========================
   ORDERS (Sheet 1)
========================= */

function getOrders() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Form Responses 1");
  const rows = sheet.getDataRange().getValues();
  rows.shift(); 

  const data = rows.map(row => ({
    waktu: row[0],
    nama: row[1],
    pesanan: row[2],
    note: row[3],
    total: row[4],
    no_order: row[5],
    paid: row[6] === true,
    status: row[8] || "terbaru" 
  }));

  return jsonOutput(data);
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
   MAIN ENTRY POINT (doPost)
   Update Stok & Konfirmasi Pembayaran
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

    // --- LOGIKA A: KONFIRMASI PEMBAYARAN ---
    if (body.type === "CONFIRM_PAYMENT") {
      console.log('Processing CONFIRM_PAYMENT for order:', body.no_order);
      
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1");
      if (!sheet) {
        console.log('Sheet "Form Responses 1" not found');
        return jsonOutput({ success: false, error: "Sheet not found" });
      }
      
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var i = 1; i < data.length; i++) {
        // Cari No Order di Kolom F (index 5)
        if (String(data[i][5]) === String(body.no_order)) {
          console.log('Found order at row:', i + 1);
          
          // 1. Update Kolom G (index 6) jadi TRUE jika status_paid true
          if (body.status_paid === true) {
            sheet.getRange(i + 1, 7).setValue(true);
            console.log('Updated payment status to true');
          }
          
          // 2. Update Kolom J (index 9) dengan Link Cloudinary
          if (body.cloudinary_url) {
            sheet.getRange(i + 1, 10).setValue(body.cloudinary_url);
            console.log('Updated cloudinary URL');
          }
          
          found = true;
          break;
        }
      }
      
      if (found) {
        console.log('Payment confirmation successful');
        return jsonOutput({ success: true, message: "Bukti pembayaran berhasil dicatat" });
      } else {
        console.log('Order not found in database');
        return jsonOutput({ success: false, message: "No Order tidak ditemukan di database" });
      }
    }

    // --- LOGIKA B: UPDATE STOK ---
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

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

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

  return jsonOutput({
    itemCount: totalItemCount,
    orderCount: todayOrders.length,
    date: today.toISOString().split('T')[0]
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