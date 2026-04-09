# 🏗️ TECHNICAL ARCHITECTURE DEEP DIVE
## Untuk Developers & Technical Teams

Dokumentasi teknis mendalam tentang bagaimana sistem bekerja.

---

## 📐 SYSTEM ARCHITECTURE

### 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (Next.js React Components - Browser)                       │
│  └─ OrderingPage, ConfirmationModal, AlertModal            │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    [API Proxy Layer]
                    (/api/proxy/*)
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                      │
│  (Client & Server - React + Next.js API Routes)             │
│  └─ payment-verification.ts, qris-generator.ts             │
│  └─ API routes forwarding CORS-safe requests               │
└─────────────────────────────────────────────────────────────┘
                            ↕
                   [HTTP/REST Interface]
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                           │
│  (Google Apps Script Backend)                               │
│  └─ Database operations (Google Sheets)                     │
│  └─ Order processing, stock management                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                          │
│  (Google Sheets Data)                                       │
│  └─ Form Responses 1 (Orders)                              │
│  └─ Stok (Inventory)                                        │
│  └─ Config (Settings)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 REQUEST/RESPONSE CYCLE

### Flow 1: GET Stock (Initial Load)

```
1. BROWSER LOADS APP
   ↓
2. app/page.tsx useEffect() triggers
   └─ Calls: fetch('/api/proxy/stock?api=stock')
   ↓
3. NEXT.JS ROUTE: app/api/proxy/stock/route.ts
   └─ Handler: async function GET(request)
   └─ Reads query params
   └─ Forwards to Google Apps Script
   ↓
4. GOOGLE APPS SCRIPT
   └─ doGet(e) handler receives request
   └─ Checks e.parameter.api === 'stock'
   └─ Calls getStock() function
   └─ Reads "Stok" sheet
   └─ Returns JSON array
   ↓
5. RESPONSE TRAVELS BACK
   ↓
6. BROWSER RECEIVES DATA
   └─ Sets state: setStock([...])
   └─ UI updates with stock levels
```

**Code Flow:**
```
Request:  browser → Next.js (/api/proxy/stock) → Google Apps Script (doGet)
Response: Google Apps Script → Next.js (/api/proxy/stock) → browser
```

**CORS:** Solved karena sama-origin (browser → same domain untuk API proxy)

---

### Flow 2: POST Order (Form Submission)

```
1. USER FILLS FORM & CLICKS SUBMIT
   ↓
2. app/page.tsx handleModalSubmit() called
   ├─ Generate order number (ORD-XXXX)
   ├─ Fire Google Form submission (fallback)
   └─ Submit stock update via API (background)
   ↓
3. PARALLEL: Update Stock
   └─ fetch('/api/proxy/stock') POST
   └─ Next.js route handler
   └─ Google Apps Script doPost(UPDATE_STOCK)
   └─ Updates "Stok" sheet
   ↓
4. UI UPDATES
   └─ Show ConfirmationModal dengan QRIS
   └─ Countdown timers start (10s → 5s)
   ↓
5. QRIS CODE GENERATED
   └─ generateQrisInfo(amount)
   └─ QRIS encoded dengan amount
   └─ Display ke user
```

**Timeline:**
- t=0s: User clicks submit
- t=0-1s: Order number generated, Google Form submitted, stock update initiated
- t=2-3s: ConfirmationModal appears
- t=5s: QRIS code displays
- t=10s: "Sudah Bayar" button enables

---

### Flow 3: Payment Verification (Complex)

```
1. USER UPLOADS PAYMENT PROOF IMAGE
   ↓
2. AlertModal handleFileUpload() triggered
   ├─ Displays "Sedang Memverifikasi..." state
   ├─ Calls verifyPayment(file, expectedAmount)
   ↓
3. verifyPayment() IN PAYMENT-VERIFICATION.TS
   ├─ STEP A: Extract text locally
   │  ├─ Create FileReader
   │  ├─ Convert file → Data URL
   │  └─ Tesseract.js recognize (OCR - RUNS IN BROWSER)
   │     └─ Downloads Indonesian language model (first time)
   │     └─ Process image
   │     └─ Return extracted text
   │
   ├─ STEP B: Validate extracted text
   │  ├─ validatePayment(text, expectedAmount)
   │  │  ├─ Check 1: Outlet identifier present?
   │  │  ├─ Check 2: Success keywords present?
   │  │  ├─ Check 3: Amount match (±50)?
   │  │  └─ Return true/false
   │  │
   │  └─ If validation fails → return early
   │
   ├─ STEP C: If valid, upload to Cloudinary
   │  ├─ uploadToCloudinary(file)
   │  ├─ FormData append (file + preset)
   │  └─ POST to Cloudinary API
   │  └─ Return secure_url
   │
   └─ STEP D: Return result
      └─ {
             isValid: true,
             cloudinaryUrl: "https://res.cloudinary...",
             extractedText: "...",
             confidence: 0.95
           }
   ↓
4. BACK TO ALERTMODAL
   ├─ If isValid → show success message
   ├─ Call confirmPayment() to update backend
   └─ If !isValid → show error, ask to retry
   ↓
5. confirmPayment() SUBMISSION
   ├─ POST to /api/proxy/payment
   ├─ Body: {
        type: 'CONFIRM_PAYMENT',
        no_order: 'ORD-0001',
        cloudinary_url: 'https://...',
        status_paid: true
      }
   ↓
6. NEXT.JS ROUTE: app/api/proxy/payment/route.ts
   ├─ Receives POST request
   ├─ Validates body
   ├─ Forwards to Google Apps Script
   ↓
7. GOOGLE APPS SCRIPT doPost()
   ├─ Parse JSON from body
   ├─ Check type === 'CONFIRM_PAYMENT'
   ├─ Find row by no_order
   ├─ Update:
   │  ├─ Column G (payment_status) = TRUE
   │  └─ Column J (cloudinary_url) = URL
   ├─ Return success response
   ↓
8. RESPONSE RETURNS TO BROWSER
   ├─ AlertModal updates state
   ├─ Shows "Pembayaran Terverifikasi ✅"
   ├─ Enables "TERUSKAN PESANAN" button
   ↓
9. FINAL MESSAGE BUILDING
   ├─ baseMessage already exist (from step 2 order)
   ├─ Append payment proof link
   ├─ Build wa.me URL
   └─ Build WhatsApp message with image link
   ↓
10. USER CLICKS "TERUSKAN PESANAN"
    ├─ Opens wa.me URL in new tab
    ├─ Clears localStorage
    └─ Reloads page (fresh state)
```

**Key Points:**
- OCR happens CLIENT-SIDE (browser, no server)
- Validation happens CLIENT-SIDE before upload
- Only valid images upload to Cloudinary (save bandwidth)
- Database update only happens if everything valid
- All errors handled gracefully with retries

---

## 🧠 STATE MANAGEMENT

### React State Tree (app/page.tsx)

```
Home Component (State Container)
├─ pageIsLoading: boolean          // Initial data fetch
├─ name: string                    // Customer name
├─ note: string                    // Special instructions
├─ orderItems: OrderItem[]         // Current order items
│  └─ [{code: 'PKT PA', qty: 2}, ...]
├─ total: number                   // Order total (running)
├─ calcDetails: string             // For display calculation
├─ showCalcResult: boolean
├─ currentOrderNumber: string      // ORD-XXXX (saved for payment)
├─ currentOrderTotal: number       // Total before reset (for validation)
├─ paymentProofUrl: string         // Cloudinary URL after payment
├─ baseMessage: string             // Message template before image added
├─ whatsappUrl: string             // wa.me link (only after payment valid)
├─ whatsappMessage: string         // Full message with image link
├─ isStoreOpen: boolean            // Operating hours check
├─ statusReason: string | null     // Closure reason
├─ openingTimeText: string         // Configured opening time
├─ closingTimeText: string         // Configured closing time
├─ stock: StockItem[]              // Current inventory from API
├─ maxOrders: number               // Max concurrent orders
├─ isSubmitting: boolean           // Form submission state
└─ alert: AlertMessage | null      // Toast/modal messages
   └─ {type: 'success'|'danger'|'warning'|'info', message: string}
```

### State Persistence (localStorage)

```javascript
// Saved on every state change:
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

// Restored on page load:
const saved = localStorage.getItem('jukut_last_order');
if (saved) {
  const data = JSON.parse(saved);
  // Restore all states
}
```

### Component Prop Flow

```
app/page.tsx (Container with state)
  ↓ (Props: state + handlers)
app/components/OrderingPage.jsx (Layout wrapper)
  ├→ app/components/StockDisplay.jsx
  ├→ app/components/OrderForm.jsx
  │  ├→ app/components/OrderButtonGrid.jsx
  │  └→ app/components/CurrentOrder.jsx
  ├→ app/components/ConfirmationModal.jsx
  ├→ app/components/AlertModal.jsx (Payment verification)
  └→ app/components/TutorialModal.jsx
```

---

## 🔐 DATA VALIDATION LAYERS

### Client-Side Validation

**File:** `app/lib/payment-verification.ts`

```
INPUT: Image File
  ↓
1. FILE VALIDATION
   ├─ Check: Type is image
   └─ Check: File size reasonable
   ↓
2. OCR EXTRACTION (Tesseract.js)
   ├─ Process: Image → Text
   └─ Confidence: 0.0 - 1.0
   ↓
3. TEXT VALIDATION
   ├─ Normalize: lowercase, spaces, formatting
   ├─ Parse: Extract amounts using regex
   └─ Validate: In acceptable range
   ↓
4. 3-TIER PAYMENT VALIDATION
   ├─ Check 1: outlet_identifier
   │  ├─ Required: ['ayam jukut cabe ijo', 'ayam jukut', 'cabe ijo', 'jkt']
   │  └─ Purpose: Prevent payments dari merchant lain
   │
   ├─ Check 2: success_keywords
   │  ├─ Required: One of ['berhasil', 'success', 'lunas', 'paid', 'kamu membayar', 'pembayaran']
   │  └─ Purpose: Confirm actual payment (not just QRIS display)
   │
   └─ Check 3: amount_matching
       ├─ Exact match: amount === expectedAmount
       ├─ Tolerance: Math.abs(amount - expectedAmount) <= 50
       └─ Purpose: Verify correct amount paid
   ↓
5. CONDITIONAL UPLOAD
   ├─ If all valid → uploadToCloudinary(file)
   └─ If any fail → Return early, NO upload
   ↓
OUTPUT: {isValid: boolean, cloudinaryUrl: string, ...}
```

### Amount Extraction Logic

```typescript
export function extractQRISAmount(ocrText: string): number | null {
  const text = normalize(ocrText);  // lowercase, standardize
  
  // STRATEGY 1: Label-based extraction
  // Look for patterns: "TOTAL: Rp 50.000", "NOMINAL Rp50,000", etc.
  const labeled = extractAmountByLabel(text);
  if (labeled !== null) return labeled;
  
  // STRATEGY 2: Fallback to largest valid candidate
  // Extract ALL numbers, validate range, return largest
  const fallback = extractByCandidates(text);
  if (fallback !== null) return fallback;
  
  // STRATEGY 3: Not found
  return null;
}

function extractAmountByLabel(text: string): number | null {
  const patterns = [
    /total\s*:?\s*rp?\.?\s*([\d.,]+)/i,    // "Total: Rp 50.000"
    /nominal\s*:?\s*rp?\.?\s*([\d.,]+)/i,  // "Nominal Rp 50000"
    /rp\s*\.?\s*([\d.,]+)/i,                // "Rp 50.000"
    // ... more patterns
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (isValidAmount(amount)) return amount;
    }
  }
  return null;
}

function extractByCandidates(text: string): number | null {
  // Multiple pattern matching with global flag (find ALL)
  const patterns = [
    /rp\s*\.?\s*([\d.,]+)/gi,        // All "Rp XX"
    /([\d]{1,3}\.[\d]{3})/gi,        // All "XX.XXX"
    /([\d]+)/gi                      // All numbers
  ];
  
  const candidates = new Set<number>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseAmount(match[1] || match[0]);
      if (isValidAmount(amount)) candidates.add(amount);
    }
  }
  
  // Return largest (most likely the total)
  return Math.max(...candidates) || null;
}

function isValidAmount(amount: number): boolean {
  // Business logic: acceptable range untuk food order
  if (amount < 1000 || amount > 500000) return false;  // Range check
  if (amount.toString().length > 6) return false;      // Not too many digits
  return true;
}
```

---

## 🌐 API ENDPOINTS

### GET /api/proxy/stock

**Purpose:** Fetch all available data (orders, stock, config)

**Implementation:**
```typescript
// app/api/proxy/stock/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const api = searchParams.get('api');
  
  const response = await fetch(APPS_SCRIPT_URL + `?api=${api}`);
  const data = await response.json();
  return Response.json(data);
}
```

**Supported queries:**
- `?api=stock` → Inventory levels
- `?api=config` → Operating config
- `?api=orders` → All orders (admin view)
- `?api=orderItemCount` → Single order detail

**Error Handling:**
- Network error → Retry with exponential backoff
- Timeout (30s) → Return error
- Invalid JSON → Return error

---

### POST /api/proxy/payment

**Purpose:** Submit payment confirmation to backend

**Implementation:**
```typescript
// app/api/proxy/payment/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate required fields
  if (!body.no_order || !body.cloudinary_url) {
    return Response.json({success: false, error: 'Missing fields'}, 
                        {status: 400});
  }
  
  // Forward to Google Apps Script
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return Response.json(data);
}
```

**Request Body:**
```json
{
  "type": "CONFIRM_PAYMENT",
  "no_order": "ORD-0001",
  "cloudinary_url": "https://res.cloudinary.com/...",
  "status_paid": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment confirmed",
  "order": "ORD-0001"
}
```

**Error Handling:**
- Timeout → Retry 5 times with exponential backoff
- Invalid order → 404 (Order not found)
- Permission denied → 403
- Server error → 500

---

## 📊 DATABASE SCHEMA (Google Sheets)

### Sheet: "Form Responses 1"

```
Column A: waktu
Type: TIMESTAMP
Format: YYYY-MM-DDTHH:MM:SS
Example: 2026-04-09T14:30:45
Purpose: Order timestamp

Column B: no_order  (CUSTOM, not from form)
Type: STRING
Format: ORD-DDDD
Example: ORD-0001
Purpose: Unique order ID (generated by script)
Generation: Max existing daily + 1

Column C: name
Type: STRING
Purpose: Customer name (from form)
Required: YES

Column D: order
Type: STRING (Multiline)
Format: ITEM_CODE QTY\nITEM_CODE QTY\n...
Example: "PKT PA 2\nEXT NSP 1"
Purpose: Item list (from form)
Required: YES

Column E: total
Type: NUMBER
Format: Integer (no decimals)
Example: 48000
Purpose: Order total (computed)
Required: YES

Column F: note
Type: STRING (Multiline)
Purpose: Special instructions (from form)
Required: NO

Column G: status
Type: STRING
Enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled']
Default: 'pending'
Purpose: Order fulfillment status

Column H: payment_status (RENAMED: status)
Type: BOOLEAN
Enum: [TRUE, FALSE]
Default: FALSE
Purpose: Payment confirmed?
Updated by: confirmPayment() backend

Column I: (reserved)

Column J: cloudinary_url
Type: STRING (URL)
Example: "https://res.cloudinary.com/..."
Purpose: Payment proof image URL
Updated by: confirmPayment() backend
```

**Example Row:**
```
A: 2026-04-09T14:30:45
B: ORD-0001
C: John Doe
D: PKT PA 2\nEXT NSP 1
E: 48000
F: Tambah extra sambal
G: pending
H: FALSE
I: (empty)
J: (empty, filled after payment)
```

### Sheet: "Stok" / "Stok outlet Cempaka"

```
Column A: nama_item
Type: STRING
Example: "PAHA ATAS"
Purpose: Item identifier (matching priceMap)

Column B: stok
Type: NUMBER (Integer)
Example: 20
Purpose: Current inventory level
Updated by: updateStock() background function

Column C: kategori
Type: STRING
Enum: ['paket', 'non_paket', 'tambahan']
Purpose: Menu category grouping
```

**Example Rows:**
```
A: PAHA ATAS        B: 20    C: paket
A: DADA             B: 15    C: paket
A: NASI DAUN JERUK  B: 50    C: tambahan
A: SAMBAL IJO       B: 100   C: tambahan
```

### Sheet: "Config"

```
Column A: jamBuka
Type: TIME
Format: HH:MM
Example: "10:00"
Purpose: Store opening time

Column B: jamTutup
Type: TIME
Format: HH:MM
Example: "15:30"
Purpose: Store closing time

Column C: maxOrders
Type: NUMBER
Example: 15
Purpose: Max concurrent orders before closing

Column D: outletName
Type: STRING
Example: "AYAM JUKUT CABE IJO"
Purpose: Business name (for validation keywords)

Column E-F: (optional expansion columns)
```

**Example Row:**
```
A: 10:00    B: 15:30    C: 15    D: AYAM JUKUT CABE IJO
```

---

## 🔒 SECURITY CONSIDERATIONS

### Client-Side Security

**1. Form Validation:**
- Name required, min length 2
- Order items required, min quantity 1
- Amount calculated (can't be tampered)

**2. Payment Validation:**
- OCR confirmation (can't just upload any image)
- Outlet identifier check (specific to business)
- Success keyword requirement (actual payment confirmation)
- Amount verification (prevents fraudulent amounts)

**3. localStorage Exploitation:**
- Data is local-only
- No sensitive data stored (no passwords, no temp tokens)
- User can clear anytime

### Server-Side Security

**1. API Endpoint Protection:**
- No authentication required (intentional: stateless)
- Rate limiting: Not implemented (add if needed)
- CORS: Restricted to same-origin

**2. Google Apps Script:**
- Only deployed script owner can edit code
- Sheet access via OAuth (automatic)
- No SQL injection risk (no SQL used)

**3. Database Access:**
- Google Sheets access controlled via Google account
- Only view/edit by authorized users
- No direct public write access

### Data Privacy

**1. Payment Information:**
- Payment proof images stored in Cloudinary
- URL only saved (not image binary)
- User can delete from Cloudinary anytime

**2. Customer Data:**
- Name & phone stored in Google Sheets
- Visible only to sheet owner
- No 3rd party access

**3. No Sensitive Data:**
- Password: None
- Credit card: Never stored
- Banking info: Never stored
- Backup details: Not saved

---

## 🚀 PERFORMANCE OPTIMIZATION

### Frontend Optimization

**1. Lazy Loading:**
```typescript
// Dynamic imports untuk heavy components
const TortialModal = dynamic(() => import('./TutorialModal'), 
  { ssr: false });
```

**2. Image Optimization:**
- Cloudinary auto-resize
- Next.js Image component for local assets
- Lazy load Foto Produk

**3. Code Splitting:**
- Next.js automatic per-page splitting
- React lazy for components

**4. Caching:**
- localStorage for order persistence
- API response caching: Not implemented (add if necessary)

### Backend Optimization

**1. Google Apps Script:**
- Query caching: Not needed (fast read)
- Batch operations: Used for stock update

**2. Sheet Operations:**
- Read: getOrders() → full scan, O(n)
- Write: appendRow() → single row, O(1)
- Update: updateRange() → single cell, O(1)

**3. For Scale-Up:**
- Migrate to Firebase (real-time)
- Implement API response caching
- Add read replicas if needed

---

## 🐛 ERROR HANDLING STRATEGY

### Client-Side Error Handling

```typescript
try {
  const result = await verifyPayment(file, amount);
  if (result.isValid) {
    await confirmPayment(...);
  }
} catch (error) {
  if (error.message.includes('network')) {
    // Network error
    showError('Koneksi terputus..., coba lagi');
  } else if (error.message.includes('timeout')) {
    // Timeout
    showError('Permintaan timeout, coba lagi');
  } else if (error.message.includes('OCR')) {
    // OCR error
    showError('Gagal baca gambar, coba upload ulang');
  } else {
    // Generic error
    showError('Terjadi kesalahan, mohon coba lagi');
  }
}
```

### Server-Side Error Handling

```javascript
// Google Apps Script
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.type === 'CONFIRM_PAYMENT') {
      const result = confirmPayment(data.no_order, data.cloudinary_url);
      if (result) {
        return ContentService.createTextOutput(
          JSON.stringify({success: true, message: 'OK'})
        );
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({success: false, error: 'Order not found'})
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({success: false, error: error.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Retry Logic

```typescript
// confirmPayment() di payment-verification.ts
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const response = await fetch('/api/proxy/payment', {...});
    if (response.ok) return;
  } catch (error) {
    if (attempt < maxRetries) {
      // Progressive backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
      await sleep(delay);
    } else {
      throw error;
    }
  }
}
```

---

## 📝 CODE QUALITY

### Type Safety (TypeScript)

```typescript
// All interfaces defined, NO any types
interface OrderItem {
  code: string;
  qty: number;
}

interface AlertMessage {
  type: 'danger' | 'warning' | 'success' | 'info';
  message: string;
}

interface PaymentVerificationResult {
  isValid: boolean;
  cloudinaryUrl: string;
  extractedText: string;
  confidence: number;
}
```

### ESLint Configuration

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      // ... more rules
    }
  }
];
```

### Code Comments

- Comments on complex logic (OCR, validation)
- JSDoc for exported functions
- Inline comments for non-obvious code

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist

- [ ] Order flow (form → QRIS → confirmation)
- [ ] Stock deduction
- [ ] Payment verification (valid image)
- [ ] Payment rejection (invalid image)
- [ ] localStorage persistence
- [ ] Mobile responsiveness
- [ ] WhatsApp sharing
- [ ] Network error recovery
- [ ] Rate limiting (if implemented)

### Test Cases for Payment Verification

```javascript
testCases = [
  {
    name: 'Valid QRIS with correct amount',
    image: 'qris_50000.png',
    expectedAmount: 50000,
    expected: true
  },
  {
    name: 'Amount mismatch',
    image: 'qris_60000.png',
    expectedAmount: 50000,
    expected: false  // (difference > 50)
  },
  {
    name: 'Missing outlet identifier',
    image: 'qris_other_merchant.png',
    expectedAmount: 50000,
    expected: false
  },
  {
    name: 'No success keyword',
    image: 'qris_pending.png',
    expectedAmount: 50000,
    expected: false
  }
];
```

---

## 📚 REFERENCE

### Key Files Summary

| File | Purpose | Key Functions |
|------|---------|----------------|
| `app/page.tsx` | Main state container | handleModalSubmit, onPaymentConfirmed |
| `payment-verification.ts` | Payment logic | verifyPayment, validatePayment, confirmPayment |
| `qris-generator.ts` | QRIS generation | generateQrisInfo |
| `api-config.ts` | API config | API_URLS constants |
| `settings.ts` | App settings | DEVELOPER_MODE, CLOUDINARY_CLOUD_NAME |
| `spreadsheet-script.gs` | Backend service | doGet, doPost, confirmPayment |

### External Dependencies

- **tesseract.js**: OCR, client-side only
- **qrcode.react**: QR code display
- **next/image**: Image optimization
- **tailwindcss**: Styling framework

---

**This document serves as reference for developers who need to understand the system deeply for customization or troubleshooting.**

---
