function doGet(e) {

  const api = e.parameter.api || "orders";

  if (api === "orders") return getOrders();

  if (api === "orderItemCount") return getOrderItemCount();

  if (api === "stock") return getStock();

  if (api === "config") return getConfig();

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

  rows.shift(); // hapus header

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
   ORDER ITEM COUNT (untuk validasi berdasarkan jumlah item)
========================= */
function getOrderItemCount() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Form Responses 1");

  const rows = sheet.getDataRange().getValues();
  rows.shift(); // hapus header

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  let totalItemCount = 0;

  // Filter orders untuk hari ini dan hitung total item
  const todayOrders = rows.filter(row => {
    // Cek apakah ada no_order yang valid
    const noOrder = row[5]; // kolom no_order
    if (noOrder === null || noOrder === undefined || String(noOrder).trim() === '') {
      return false;
    }

    // Cek apakah waktu adalah hari ini
    const waktu = row[0]; // kolom waktu
    if (!waktu) return false;
    
    const t = new Date(waktu);
    if (Number.isNaN(t.getTime())) return false;

    return (
      t.getFullYear() === y &&
      t.getMonth() === m &&
      t.getDate() === d
    );
  });

  // Hitung total item dari semua pesanan hari ini (hanya PKT dan NP)
  todayOrders.forEach(row => {
    const pesanan = row[2]; // kolom pesanan
    if (pesanan && typeof pesanan === 'string') {
      const lines = pesanan.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Parse format: "PKT PA 3" atau "NP DD 2" dll
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const prefix = parts[0];
          // Hanya hitung item dengan kode PKT atau NP
          if (prefix === 'PKT' || prefix === 'NP') {
            if (parts.length >= 3) {
              const qty = parseInt(parts[2], 10) || 1;
              totalItemCount += qty;
            } else {
              // Jika tidak ada angka, anggap 1
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

/* =========================

   STOCK (Sheet 2)

========================= */

function getStock() {

  const sheet = SpreadsheetApp

    .getActiveSpreadsheet()

    .getSheetByName("Stok outlet Cempaka");

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();

  const data = rows

    .filter(r => r[1]) // hanya yang ada nama item

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
   ITEMS WITH LINKS (jika ada kolom tambahan untuk gambar)
========================= */
function getItemsWithLinks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
  
  if (!sheet) {
    return jsonOutput({ error: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan` });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return jsonOutput([]);
  }

  // Coba ambil lebih banyak kolom untuk mencari kolom gambar/link
  const maxCols = sheet.getLastColumn();
  const rows = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

  const data = rows
    .filter(r => r[1]) // hanya yang ada nama item
    .map(row => ({
      id_item: row[0],
      nama_item: row[1],
      stok: row[2],
      status: row[3],
      catatan: row[4],
      // Kolom tambahan jika ada (misalnya gambar di kolom F, G, dst)
      gambar: row[5] || null,
      link: row[6] || null
    }));

  return jsonOutput(data);
}

/* =========================

   CONFIG (Sheet 2)

========================= */

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

    status_buka: false // logic di frontend

  });

}

/* =========================
   UPDATE STOCK FUNCTIONS
========================= */
function orderStock(body) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000); // wait up to 10 seconds
  } catch (e) {
    return jsonOutput({
      success: false,
      message: "Sistem sedang sibuk, coba lagi dalam beberapa saat"
    });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
    
    if (!sheet) {
      return jsonOutput({
        success: false,
        message: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan`
      });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonOutput({
        success: false,
        message: "Tidak ada data stock"
      });
    }

    const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

    for (let i = 0; i < rows.length; i++) {
      const idItem = rows[i][0];
      const namaItem = rows[i][1];
      let stok = Number(rows[i][2]);

      if (
        (body.id_item && body.id_item === idItem) ||
        (body.nama_item && body.nama_item === namaItem)
      ) {
        if (stok <= 0) {
          return jsonOutput({
            success: false,
            message: `${namaItem} sedang habis, silakan ganti menu`
          });
        }

        stok -= 1;

        let status = "Tersedia";
        if (stok === 0) status = "Terjual Habis";
        else if (stok < 5) status = "Hampir Habis";

        // update sheet
        sheet.getRange(i + 2, 3).setValue(stok);
        sheet.getRange(i + 2, 4).setValue(status);

        return jsonOutput({
          success: true,
          id_item: idItem,
          nama_item: namaItem,
          stok,
          status
        });
      }
    }

    return jsonOutput({
      success: false,
      message: "Item tidak ditemukan"
    });

  } catch (error) {
    console.error("Error in orderStock:", error);
    return jsonOutput({
      success: false,
      message: "Terjadi kesalahan sistem: " + error.message
    });
  } finally {
    lock.releaseLock();
  }
}

function updateStockBatch(stockUpdates) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000);
  } catch (e) {
    return jsonOutput({
      success: false,
      message: "Sistem sedang sibuk, coba lagi dalam beberapa saat"
    });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STOCK_SHEET_NAME);
    
    if (!sheet) {
      return jsonOutput({
        success: false,
        message: `Sheet "${STOCK_SHEET_NAME}" tidak ditemukan`
      });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonOutput({
        success: false,
        message: "Tidak ada data stock"
      });
    }

    const rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    const results = [];

    for (const update of stockUpdates) {
      let found = false;
      
      for (let i = 0; i < rows.length; i++) {
        const idItem = rows[i][0];
        const namaItem = rows[i][1];
        let currentStok = Number(rows[i][2]);

        if (
          (update.id_item && update.id_item === idItem) ||
          (update.nama_item && update.nama_item === namaItem)
        ) {
          found = true;
          
          // Check if update contains new stock value directly (from frontend)
          let newStok, status;
          if (update.stok !== undefined && update.status !== undefined) {
            // Frontend is sending new stock value and status directly
            newStok = Number(update.stok);
            status = update.status;
          } else if (update.quantity !== undefined) {
            // Legacy format: subtract quantity from current stock
            if (currentStok < update.quantity) {
              results.push({
                success: false,
                id_item: idItem,
                nama_item: namaItem,
                message: `Stok ${namaItem} tidak mencukupi (tersedia: ${currentStok}, diminta: ${update.quantity})`
              });
              continue;
            }
            
            newStok = currentStok - update.quantity;
            status = "Tersedia";
            if (newStok === 0) status = "Terjual Habis";
            else if (newStok < 5) status = "Hampir Habis";
          } else {
            results.push({
              success: false,
              id_item: idItem,
              nama_item: namaItem,
              message: "Format update tidak valid - diperlukan 'stok' dan 'status' atau 'quantity'"
            });
            continue;
          }

          // update sheet
          sheet.getRange(i + 2, 3).setValue(newStok);
          sheet.getRange(i + 2, 4).setValue(status);

          // update rows array untuk perhitungan selanjutnya
          rows[i][2] = newStok;
          rows[i][3] = status;

          results.push({
            success: true,
            id_item: idItem,
            nama_item: namaItem,
            old_stok: currentStok,
            new_stok: newStok,
            status
          });
          break;
        }
      }

      if (!found) {
        results.push({
          success: false,
          id_item: update.id_item || null,
          nama_item: update.nama_item || null,
          message: "Item tidak ditemukan"
        });
      }
    }

    return jsonOutput({
      success: true,
      results: results
    });

  } catch (error) {
    console.error("Error in updateStockBatch:", error);
    return jsonOutput({
      success: false,
      message: "Terjadi kesalahan sistem: " + error.message
    });
  } finally {
    lock.releaseLock();
  }
}

/* =========================

   HELPERS

========================= */

function jsonOutput(data) {

  return ContentService

    .createTextOutput(JSON.stringify(data))

    .setMimeType(ContentService.MimeType.JSON);

}

/* =========================
   UTILITY FUNCTIONS (opsional)
========================= */
function testGetStock() {
  const result = getStock();
  console.log(result.getContent());
}

function testGetOrders() {
  const result = getOrders();
  console.log(result.getContent());
}

function testGetConfig() {
  const result = getConfig();
  console.log(result.getContent());
}