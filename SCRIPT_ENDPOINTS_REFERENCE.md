# Google Apps Script - Endpoints Reference

**Base URL**: `https://script.google.com/macros/s/[YOUR_SCRIPT_ID]/exec`

---

## 📋 Table of Contents
1. [GET Endpoints (SC-A)](#get-endpoints)
2. [POST Endpoints (SC-B)](#post-endpoints)
3. [Implementation Examples](#implementation-examples)
4. [Best Practices](#best-practices)

---

## GET Endpoints

### SC-A1: Get Orders (Last 100)
**Description**: Retrieve last 100 orders from Form Responses sheet (optimized for performance)

**Request**:
```
GET ?api=orders
```

**Response**:
```json
[
  {
    "waktu": "2026-04-09T12:34:56",
    "nama": "John Doe",
    "pesanan": "PKT PA 2\nNP PB 1",
    "note": "Sambal dipisah",
    "total": 44000,
    "no_order": "ORD-0245",
    "paid": true,
    "status": "siap"
  }
]
```

**Usage**: Web app order display, mobile app order list

---

### SC-A2: Get Order Item Count (Today)
**Description**: Get today's total items ordered and order count

**Request**:
```
GET ?api=orderItemCount
```

**Response**:
```json
{
  "itemCount": 87,
  "orderCount": 23,
  "date": "2026-04-09"
}
```

**Usage**: Dashboard counter, daily summary display

---

### SC-A3: Get Stock
**Description**: Get current stock status for all menu items

**Request**:
```
GET ?api=stock
```

**Response**:
```json
[
  {
    "id_item": "1",
    "nama_item": "PAHA ATAS",
    "stok": 45,
    "status": "Tersedia",
    "catatan": "Mulai berkurang"
  }
]
```

**Usage**: Menu availability check, stock display

---

### SC-A4: Get Config
**Description**: Get store configuration (opening/closing time, max orders)

**Request**:
```
GET ?api=config
```

**Response**:
```json
{
  "jam_buka": "10.00",
  "jam_tutup": "15.30",
  "max_pesanan": 15,
  "status_buka": false
}
```

**Usage**: Store status check, opening hours display

---

### SC-A5: Get Next Order ID
**Description**: Generate next order number for today (queries ALL rows, no limits)

**Request**:
```
GET ?api=getNextOrderId
```

**Response**:
```json
{
  "no_order": "ORD-0246"
}
```

**Usage**: Client-side order numbering generation

---

### SC-A6: Delete Data Older Than X Days
**Description**: Delete orders older than specified days (1 week, 2 weeks, 3 weeks, etc.)

**Request**:
```
GET ?api=deleteOlderThan&days=7
GET ?api=deleteOlderThan&days=14
GET ?api=deleteOlderThan&days=21
```

**Parameters**:
- `days` (integer, default: 7) - Number of days to keep

**Response Success**:
```json
{
  "success": true,
  "message": "45 baris yang lebih dari 7 hari telah dihapus",
  "deletedRows": 45,
  "threshold": "2026-04-02T12:34:56.789Z"
}
```

**Response Error**:
```json
{
  "success": false,
  "error": "Sheet 'Form Responses 1' tidak ditemukan"
}
```

**Usage**: Android app - scheduled cleanup, maintenance

---

### SC-A7: Delete By Status
**Description**: Delete all orders with specific status (dibatalkan, siap, selesai, dll)

**Request**:
```
GET ?api=deleteByStatus&status=dibatalkan
GET ?api=deleteByStatus&status=siap
GET ?api=deleteByStatus&status=selesai
```

**Parameters**:
- `status` (string, default: "dibatalkan") - Status value from Column I

**Valid Status Values**:
- `dibatalkan` - Cancelled orders
- `siap` - Ready orders
- `selesai` - Completed orders
- `terbaru` - New orders
- `dalam proses` - In progress
- (any custom status in the spreadsheet)

**Response Success**:
```json
{
  "success": true,
  "message": "12 baris dengan status \"dibatalkan\" telah dihapus",
  "deletedRows": 12,
  "status": "dibatalkan"
}
```

**Usage**: Android app - conditional cleanup, status-based archive

---

### SC-A8: Update Order Status
**Description**: Change order status (e.g., pending → ready → completed)

**Request**:
```
GET ?api=updateStatus&no_order=ORD-0245&status=siap
```

**Parameters**:
- `no_order` (string) - Order number to update
- `status` (string) - New status value

**Response Success**:
```json
{
  "success": true,
  "message": "Status diperbarui ke siap"
}
```

**Response Error**:
```json
{
  "success": false,
  "message": "No Order tidak ditemukan"
}
```

**Usage**: Order status update from dashboard/Android app

---

## POST Endpoints

### SC-B1: Confirm Payment
**Description**: Record payment proof and mark order as paid

**Request**:
```
POST /exec
Content-Type: application/json

{
  "type": "CONFIRM_PAYMENT",
  "no_order": "ORD-0245",
  "status_paid": true,
  "cloudinary_url": "https://res.cloudinary.com/[...]/image.jpg"
}
```

**Updates**:
- Column G (paid status) → TRUE
- Column J (payment proof URL) → Cloudinary link

**Response Success**:
```json
{
  "success": true,
  "message": "Bukti pembayaran berhasil dicatat"
}
```

**Response Error**:
```json
{
  "success": false,
  "message": "No Order tidak ditemukan di database"
}
```

**Usage**: Payment verification from web app

---

### SC-B2: Update Stock
**Description**: Deduct stock after order confirmation

**Request**:
```
POST /exec
Content-Type: application/json

{
  "updates": [
    {
      "nama_item": "PAHA ATAS",
      "quantity": 2
    },
    {
      "nama_item": "NASI DAUN JERUK",
      "quantity": 2
    }
  ]
}
```

**Updates Stock Sheet**:
- Reduce quantity (Column C)
- Update status (Column D): "Tersedia" | "Hampir Habis" | "Terjual Habis"

**Response**:
```
Success
```

**Usage**: Auto deduct after order submitted

---

## Implementation Examples

### JavaScript / Fetch API

```javascript
// GET: Fetch orders
const orders = await fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec?api=orders')
  .then(r => r.json());

// GET: Next order ID
const { no_order } = await fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec?api=getNextOrderId')
  .then(r => r.json());

// GET: Delete older than 7 days
const result = await fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec?api=deleteOlderThan&days=7')
  .then(r => r.json());
console.log(`Deleted ${result.deletedRows} rows`);

// GET: Delete by status
const result2 = await fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec?api=deleteByStatus&status=dibatalkan')
  .then(r => r.json());

// POST: Confirm payment
const confirmResult = await fetch('https://script.google.com/macros/s/[SCRIPT_ID]/exec', {
  method: 'POST',
  body: JSON.stringify({
    type: 'CONFIRM_PAYMENT',
    no_order: 'ORD-0245',
    status_paid: true,
    cloudinary_url: 'https://res.cloudinary.com/...'
  })
}).then(r => r.json());
```

### Kotlin (Android)

```kotlin
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.http.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface GoogleAppsScriptApi {
  @GET("exec")
  suspend fun getOrders(@Query("api") api: String = "orders"): List<Order>
  
  @GET("exec")
  suspend fun getNextOrderId(@Query("api") api: String = "getNextOrderId"): OrderIdResponse
  
  @GET("exec")
  suspend fun deleteOlderThan(
    @Query("api") api: String = "deleteOlderThan",
    @Query("days") days: Int = 7
  ): DeleteResponse
  
  @GET("exec")
  suspend fun deleteByStatus(
    @Query("api") api: String = "deleteByStatus",
    @Query("status") status: String
  ): DeleteResponse
}

// Usage
val api = Retrofit.Builder()
  .baseUrl("https://script.google.com/macros/s/[SCRIPT_ID]/")
  .build()
  .create(GoogleAppsScriptApi::class.java)

// Delete older than 14 days
val deleteResult = api.deleteOlderThan(days = 14)
val message = "Deleted ${deleteResult.deletedRows} rows"

// Delete by status
val deleteStatusResult = api.deleteByStatus(status = "dibatalkan")
```

### Flutter / Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAppsScriptService {
  static const String baseUrl = 'https://script.google.com/macros/s/[SCRIPT_ID]/exec';
  
  // SC-A1: Get orders
  static Future<List<dynamic>> getOrders() async {
    final response = await http.get(Uri.parse('$baseUrl?api=orders'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to fetch orders');
  }
  
  // SC-A6: Delete older than
  static Future<Map<String, dynamic>> deleteOlderThan(int days) async {
    final response = await http.get(Uri.parse('$baseUrl?api=deleteOlderThan&days=$days'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Delete failed');
  }
  
  // SC-A7: Delete by status
  static Future<Map<String, dynamic>> deleteByStatus(String status) async {
    final response = await http.get(Uri.parse('$baseUrl?api=deleteByStatus&status=$status'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Delete failed');
  }
}

// Usage
void main() async {
  // Delete 21 days old
  final result = await GoogleAppsScriptService.deleteOlderThan(21);
  print('Deleted ${result['deletedRows']} rows');
  
  // Delete cancelled orders
  final result2 = await GoogleAppsScriptService.deleteByStatus('dibatalkan');
  print('Deleted ${result2['deletedRows']} rows');
}
```

### Python

```python
import requests

BASE_URL = "https://script.google.com/macros/s/[SCRIPT_ID]/exec"

def delete_older_than(days: int) -> dict:
    """SC-A6: Delete data older than X days"""
    response = requests.get(f"{BASE_URL}?api=deleteOlderThan&days={days}")
    return response.json()

def delete_by_status(status: str) -> dict:
    """SC-A7: Delete by status"""
    response = requests.get(f"{BASE_URL}?api=deleteByStatus&status={status}")
    return response.json()

def get_orders() -> list:
    """SC-A1: Get orders"""
    response = requests.get(f"{BASE_URL}?api=orders")
    return response.json()

# Usage
if __name__ == "__main__":
    # Delete older than 7 days
    result = delete_older_than(7)
    print(f"Deleted {result['deletedRows']} rows older than 7 days")
    
    # Delete cancelled orders
    result2 = delete_by_status("dibatalkan")
    print(f"Deleted {result2['deletedRows']} cancelled orders")
    
    # Get current orders
    orders = get_orders()
    print(f"Total current orders: {len(orders)}")
```

---

## Best Practices

### ⚠️ Data Safety
- **Always backup spreadsheet** before running delete operations
- Delete operations are **PERMANENT and CANNOT be undone**
- Test on development/staging sheet first

### 🔒 Security
- Consider adding auth token parameter (`?key=xxx`) for production
- Restrict delete endpoints to authorized users only
- Never expose Script ID in public code

### ⚡ Performance
- Delete older data **during off-hours** (e.g., 00:00-03:00)
- Don't delete too frequently (schedule weekly/monthly)
- Monitor execution logs for performance issues

### 📊 Cleanup Strategy

**Recommended Order**:
1. Delete older than 7 days (weekly)
2. Delete older than 14 days (bi-weekly)
3. Delete older than 21 days (monthly)
4. Delete by status: `dibatalkan` (completed orders)
5. Delete by status: `selesai` (archived orders)

**Timing**:
```
Minggu 1: Delete > 7 days
Minggu 2: Delete > 14 days  
Minggu 3: Delete > 21 days
Minggu 4: Delete dibatalkan + selesai
```

### 🔍 Monitoring

**Check Logs** in Google Apps Script Console:
- Go to Google Sheets → Tools → Apps Script
- Open Logs: Ctrl+Enter or View → Logs
- Look for entries like:
  - `🧹 Starting deleteOlderThanDays(7)`
  - `📋 Found 45 rows to delete`
  - `✅ Deleted 45 rows older than 7 days`

**Track Execution Time**:
- Monitor how long each delete takes
- Adjust schedule if execution > 30 seconds

### 📱 Android App Integration

**Recommended UI Flow**:
```
Settings Screen
    ↓
Maintenance Menu
    ├─ Delete > 7 days
    ├─ Delete > 14 days
    ├─ Delete > 21 days
    └─ Delete by Status
        ├─ Dibatalkan
        ├─ Siap
        └─ Selesai
```

**Confirmation Dialog**:
```
⚠️  WARNING
This action cannot be undone!

💾 Backup your spreadsheet first?

[Delete] [Cancel]
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `"Sheet not found"` | Spreadsheet structure changed | Verify sheet names are exactly: "Form Responses 1", "Stok outlet Cempaka" |
| Deletion too slow | Too many rows to process | Break into smaller batches (delete 1 week → 2 weeks separately) |
| No rows deleted | Wrong status name or threshold | Check exact status values in spreadsheet (case-sensitive) |
| "API tidak ditemukan" | Typo in endpoint name | Verify `api` parameter matches exactly: `deleteOlderThan`, `deleteByStatus` |

---

## Endpoint Summary

| Code | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| SC-A1 | GET | `?api=orders` | Fetch last 100 orders |
| SC-A2 | GET | `?api=orderItemCount` | Today's item count |
| SC-A3 | GET | `?api=stock` | Current stock status |
| SC-A4 | GET | `?api=config` | Store config (time, limits) |
| SC-A5 | GET | `?api=getNextOrderId` | Generate next order ID |
| SC-A6 | GET | `?api=deleteOlderThan&days=X` | Delete old data |
| SC-A7 | GET | `?api=deleteByStatus&status=X` | Delete by status |
| SC-A8 | GET | `?api=updateStatus&no_order=X&status=Y` | Update order status |
| SC-B1 | POST | (no api param) + type=CONFIRM_PAYMENT | Record payment proof |
| SC-B2 | POST | (no api param) + updates array | Deduct stock after order |
