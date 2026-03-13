/**
 * Google Apps Script untuk Order Jukut Online
 * VERSI BERSIH DAN DIPERBAIKI
 * 
 * Cara setup:
 * 1. Buka Google Spreadsheet Anda
 * 2. Klik Extensions > Apps Script
 * 3. Hapus kode default dan paste SELURUH kode ini
 * 4. Save dan deploy sebagai web app
 * 5. Set permissions: Execute as "Me", Access "Anyone"
 * 6. Copy URL web app yang dihasilkan dan update di frontend
 */

// Konstanta untuk nama sheet
const STOCK_SHEET_NAME = "Stok outlet Cempaka";
const ORDERS_SHEET_NAME = "Form Responses 1";

/* =========================
   MAIN ENTRY POINTS
========================= */

function doGet(e) {
  const api = e.parameter.api || "orders";
  try {
    if (api === "orders") return getOrders();
    if (api === "stock") return getStock();
    if (api === "config") return getConfig();
    if (api === "itemsWithLinks") return getItemsWithLinks();
    return jsonOutput({ error: "API tidak ditemukan" });
  } catch (error) {
    console.error("Error in doGet:", error);
    return jsonOutput({ error: "Internal server error: " + error.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    // Rute utama untuk update stok adalah array of updates
    if (Array.isArray(body)) {
      return updateStockBatch(body);
    }
    // Rute lain jika ada
    if (body.action === "order") {
      return orderStock(body);
    }
    return jsonOutput({ error: "Action tidak dikenali" });
  } catch (error) {
    console.error("Error in doPost:", error);
    return jsonOutput({ error: "Internal server error: " + error.message });
  }
}

function doOptions(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.TEXT);
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.addHeader('Access-Control-Max-Age', '86400');
  return output;
}

/* =========================
   ORDERS (Form Responses 1)
========================= */
function getOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet) return jsonOutput({ error: `Sheet "${ORDERS_SHEET_NAME}" tidak ditemukan` });
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return jsonOutput([]);
  rows.shift();
  const data = rows.map(row => ({
    waktu: row[0],
    nama: row[1],
    pesanan: row[2],
    note: row[3],
    total: row[4],
    no_order: row[5],
    paid: row[6] === true
  }));
  return jsonOutput(data);
}

/* =========================
   STOCK (Stok outlet Cempaka)
========================= */
function getStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
  if (!sheet) return jsonOutput({ error: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan` });
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOutput([]);
  const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
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

/* =========================
   CONFIG (dari sheet yang sama)
========================= */
function getConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
  if (!sheet) return jsonOutput({ error: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan` });
  try {
    const configRange = sheet.getRange("F2:H2");
    const [jamBuka, jamTutup, maxPesanan] = configRange.getValues()[0];
    return jsonOutput({
      jam_buka: jamBuka ? String(jamBuka).trim() : null,
      jam_tutup: jamTutup ? String(jamTutup).trim() : null,
      max_pesanan: maxPesanan || 0,
      status_buka: false
    });
  } catch (error) {
    console.error("Error getting config:", error);
    return jsonOutput({ jam_buka: null, jam_tutup: null, max_pesanan: 0, status_buka: false });
  }
}

/* =========================
   UPDATE STOCK FUNCTIONS
========================= */
function updateStockBatch(stockUpdates) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return jsonOutput({ success: false, message: "Sistem sedang sibuk, coba lagi dalam beberapa saat" });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
    if (!sheet) return jsonOutput({ success: false, message: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan` });

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return jsonOutput({ success: false, message: "Tidak ada data stock" });

    const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    const results = [];
    let allSucceeded = true;

    for (const update of stockUpdates) {
      let found = false;
      for (let i = 0; i < rows.length; i++) {
        const idItem = rows[i][0];
        const namaItem = rows[i][1];
        if ((update.id_item && update.id_item === idItem) || (update.nama_item && update.nama_item === namaItem)) {
          found = true;
          let currentStok = Number(rows[i][2]);
          
          if (update.quantity !== undefined) {
            if (currentStok < update.quantity) {
              allSucceeded = false;
              results.push({ success: false, nama_item: namaItem, message: `Stok ${namaItem} tidak mencukupi (tersedia: ${currentStok}, diminta: ${update.quantity})` });
            } else {
              results.push({ success: true, nama_item: namaItem });
            }
          }
          break;
        }
      }
      if (!found) {
        allSucceeded = false;
        results.push({ success: false, nama_item: update.nama_item, message: "Item tidak ditemukan" });
      }
    }

    if (!allSucceeded) {
      // Jika ada satu saja yang gagal, jangan update apapun dan kembalikan pesan error
      lock.releaseLock();
      return jsonOutput({ success: false, results: results });
    }

    // Jika semua verifikasi berhasil, baru lakukan update
    for (const update of stockUpdates) {
        for (let i = 0; i < rows.length; i++) {
            const namaItem = rows[i][1];
            if (update.nama_item === namaItem) {
                let currentStok = Number(rows[i][2]);
                let newStok = currentStok - update.quantity;
                let status = "Tersedia";
                if (newStok <= 0) status = "Terjual Habis";
                else if (newStok < 5) status = "Hampir Habis";
                
                sheet.getRange(i + 2, 3).setValue(newStok);
                sheet.getRange(i + 2, 4).setValue(status);
                break;
            }
        }
    }
    
    lock.releaseLock();
    return jsonOutput({ success: true, message: "Stok berhasil diperbarui" });

  } catch (error) {
    lock.releaseLock();
    console.error("Error in updateStockBatch:", error);
    return jsonOutput({ success: false, message: "Terjadi kesalahan sistem: " + error.message });
  }
}

/* =========================
   HELPER & UTILITY
========================= */
function jsonOutput(data) {
  var json = JSON.stringify(data);
  var output = ContentService.createTextOutput(json);
  output.setMimeType(ContentService.MimeType.JSON);
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return output;
}
