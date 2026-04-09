# 📖 TEMPLATE CUSTOMIZATION GUIDE
## Web Order Online - Panduan Lengkap untuk Customization

**Version:** 1.0  
**Last Updated:** April 9, 2026  
**Status:** Production Ready ✅

---

## 📑 TABLE OF CONTENTS

1. [Pengenalan Sistem](#pengenalan-sistem)
2. [Architecture Overview](#architecture-overview)
3. [Struktur Folder & File](#struktur-folder--file)
4. [Fungsi-Fungsi Penting](#fungsi-fungsi-penting)
5. [Halaman-Halaman Penting](#halaman-halaman-penting)
6. [Customization Guide](#customization-guide)
7. [Konfigurasi untuk Usaha Lain](#konfigurasi-untuk-usaha-lain)
8. [API Documentation](#api-documentation)
9. [Payment Integration](#payment-integration)
10. [Deployment & Production](#deployment--production)

---

## 🎯 PENGENALAN SISTEM

### Apa itu Web Order Online Ini?

Web order online ini adalah sistem pemesanan makanan **modern, elegant, dan production-ready** yang dibangun dengan teknologi terkini:

- **Frontend:** Next.js 16.1.6 + React 19.2.3 + TypeScript + Tailwind CSS
- **Backend:** Google Apps Script + Google Sheets (Serverless)
- **Payment:** QRIS + OCR untuk verifikasi otomatis
- **Image Hosting:** Cloudinary (untuk bukti pembayaran)
- **WhatsApp Integration:** Direct message ke admin

### Fitur Utama

✅ **Order Management**
- Bentuk pesanan dinamis dengan kategori
- Real-time stock display
- Automatic order numbering per hari
- Total calculation otomatis

✅ **Payment Verification**
- QRIS Code generation dinamis sesuai nominal
- OCR recognition (Tesseract.js) untuk bukti pembayaran
- Smart amount extraction (label-based + fallback)
- Offline validation terhadap outlet identifier

✅ **Fraud Prevention**
- Outlet identifier verification
- Transaction keyword validation
- Amount tolerance matching (±50 rupiah)
- Payment proof storage termasuk Cloudinary URL

✅ **User Experience**
- Beautiful mobile-first design
- Real-time stock checking
- localStorage persistence
- WhatsApp deep linking dengan pesan template
- Payment proof thumbnail preview di WhatsApp

---

## 🏗️ ARCHITECTURE OVERVIEW

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BROWSER (Frontend)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Next.js Application (React Components + State)         │   │
│  │  - OrderingPage (Form & UI)                            │   │
│  │  - AlertModal (Payment & WhatsApp)                     │   │
│  │  - ConfirmationModal (QRIS Code Display)               │   │
│  │  - Payment Verification (OCR & Validation)             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (API Calls)
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS BACKEND (API Proxy Layer)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/proxy/stock    - Fetch inventory status           │   │
│  │  /api/proxy/config   - Fetch settings & operating hours │   │
│  │  /api/proxy/payment  - Submit payment confirmation      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Purpose: Bypass CORS restrictions, centralized error handling  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Forwarding)
┌─────────────────────────────────────────────────────────────────┐
│          GOOGLE APPS SCRIPT (Backend Logic & Storage)            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  doGet(e) - API Handler for READ operations:           │   │
│  │  - api=orders       → Return all orders from Sheets     │   │
│  │  - api=stock        → Return current stock levels       │   │
│  │  - api=config       → Return config (hours, max orders) │   │
│  │                                                          │   │
│  │  doPost(e) - API Handler for WRITE operations:         │   │
│  │  - CONFIRM_PAYMENT  → Verify & save payment proof      │   │
│  │  - UPDATE_STOCK     → Deduct stock from inventory      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (Data Storage)
┌─────────────────────────────────────────────────────────────────┐
│            GOOGLE SHEETS (Data Persistence Layer)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Sheet "Form Responses 1" (Order Data)                │   │
│  │  Columns: no_order, name, items, total, status,       │   │
│  │           payment_status, cloudinary_url, timestamp    │   │
│  │                                                          │   │
│  │  Sheet "Stok outlet Cempaka" (Inventory Data)        │   │
│  │  Columns: nama_item, stok, kategori                  │   │
│  │                                                          │   │
│  │  Sheet "Config" (Settings)                            │   │
│  │  Columns: jamBuka, jamTutup, maxOrders, outlet_name  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

External Services:
├─ Tesseract.js (Client-side OCR for payment receipt reading)
├─ Cloudinary (Image hosting for payment proof)
├─ Google Forms (Alternative order submission fallback)
└─ WhatsApp API (Deep linking for message sharing)
```

### Request/Response Flow untuk Order

```
1. USER FILL FORM
   ↓
2. SUBMIT PESANAN
   ├─ POST to Google Form (fire-and-forget)
   ├─ Update stock via /api/proxy/stock (background)
   └─ Display QRIS Code
   ↓
3. USER BAYAR & UPLOAD BUKTI
   ├─ Extract text via Tesseract.js (client-side, local)
   ├─ Validate: Outlet ID → Keywords → Amount
   └─ If VALID:
      ├─ Upload to Cloudinary
      └─ POST /api/proxy/payment → Google Apps Script
   ↓
4. GOOGLE APPS SCRIPT CONFIRMATION
   ├─ Find order by no_order
   ├─ Update payment_status = TRUE
   ├─ Save cloudinary_url
   └─ Return success response
   ↓
5. BUILD WHATSAPP MESSAGE
   ├─ Append payment proof link
   └─ Display "TERUSKAN PESANAN" button
   ↓
6. USER CLICK TERUSKAN PESANAN
   ├─ Open wa.me URL
   ├─ Clear localStorage
   └─ Refresh page
```

---

## 📁 STRUKTUR FOLDER & FILE

### Root Directory
```
project-root/
├── app/                              # Next.js App Directory
│   ├── api/                         # API Routes
│   │   └── proxy/                   
│   │       ├── stock/route.ts       # Forward stock requests
│   │       ├── config/route.ts      # Forward config requests
│   │       └── payment/route.ts     # Forward payment confirmation
│   ├── components/                  # React Components (Presentational)
│   │   ├── AlertModal.tsx           # Payment & WhatsApp message modal
│   │   ├── ConfirmationModal.tsx    # QRIS code display
│   │   ├── ComingSoonModal.tsx      # Maintenance mode notification
│   │   ├── CurrentOrder.tsx         # Order display & qty management
│   │   ├── LoadingScreen.tsx        # Initial data fetch loader
│   │   ├── OrderButtonGrid.tsx      # Menu item buttons
│   │   ├── OrderForm.tsx            # Form wrapper component
│   │   ├── OrderingPage.tsx         # Main ordering page layout
│   │   ├── StockDisplay.tsx         # Stock status display
│   │   └── TutorialModal.tsx        # Interactive tutorial
│   ├── lib/                         # Utility Functions & Config
│   │   ├── api-config.ts            # API endpoints & constants
│   │   ├── payment-verification.ts  # OCR, QRIS parsing, validation
│   │   ├── qris-generator.ts        # QRIS code generation
│   │   └── settings.ts              # App configuration
│   ├── closed/                      # Maintenance page
│   │   └── page.tsx
│   ├── payment-proof/               # Payment proof display (Open Graph)
│   │   └── page.tsx
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global styles
│   └── page.tsx                     # Main home page
├── public/                          # Static assets
│   ├── Foto Produk/                # Product images
│   ├── Ornamen/                    # Decorative images
│   ├── sound/                      # Audio files
│   └── tutorial/                   # Tutorial images
├── types/                           # TypeScript type definitions (unused)
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── tailwind.config.js               # Tailwind CSS config
├── README.md                        # Main README
├── DOKUMENTASI.md                   # Original documentation
├── TEMPLATE_CUSTOMIZATION_GUIDE.md  # This file
├── spreadsheet-script.gs            # Google Apps Script (Backend)
└── eslint.config.mjs                # ESLint config
```

### Important Files Penjelasan

#### Frontend Entry
- **`app/page.tsx`** - Main component yang manage seluruh state pesanan
  - Order form state management
  - localStorage persistence
  - WhatsApp URL builder
  - Google Form submission orchestration

#### Components (Presentational & Logic)
- **`app/components/OrderingPage.tsx`** - Master layout component
  - Combine semua sub-components
  - Pass props down ke children
  
- **`app/components/AlertModal.tsx`** - Payment verification logic
  - Handle file upload
  - Trigger OCR & validation
  - Display results & WhatsApp button

- **`app/components/ConfirmationModal.tsx`** - QRIS display
  - Generate QRIS code dinamis
  - Countdown timers
  - Payment instructions

#### Utility Libraries
- **`app/lib/payment-verification.ts`** - Core payment logic
  - `verifyPayment()` - Main verification orchestrator
  - `validatePayment()` - 3-tier validation
  - `extractQRISAmount()` - Smart amount extraction
  - `confirmPayment()` - Submit to backend dengan retry

- **`app/lib/qris-generator.ts`** - QRIS generation
  - `generateQrisInfo()` - Generate QRIS code & metadata

- **`app/lib/api-config.ts`** - API configuration
  - API endpoint constants
  - `buildApiUrl()` - URL builder helper

#### Backend
- **`spreadsheet-script.gs`** - Google Apps Script
  - `doGet(e)` - Handle GET requests (orders, stock, config)
  - `doPost(e)` - Handle POST requests (payment confirmation)
  - Helper functions untuk database operations

---

## 🔧 FUNGSI-FUNGSI PENTING

### Frontend Core Functions

#### 1. **`verifyPayment(file, expectedAmount)`**
**File:** `app/lib/payment-verification.ts`

**Purpose:** Main payment verification orchestrator

```typescript
export async function verifyPayment(
  file: File, 
  expectedAmount: number
): Promise<PaymentVerificationResult>
```

**What it does:**
1. Extract text dari image file menggunakan OCR (Tesseract.js)
2. Validate text dengan 3-tier check (outlet → keywords → amount)
3. If valid: Upload ke Cloudinary & return URL
4. If invalid: Return empty URL, jangan upload

**Return value:**
```typescript
{
  isValid: boolean,           // Valid atau tidak
  cloudinaryUrl: string,      // URL image (empty jika not valid)
  extractedText: string,      // OCR extracted text
  confidence: number          // OCR confidence (0-1)
}
```

**Usage:**
```typescript
try {
  const result = await verifyPayment(file, 50000); // File dan expected amount
  if (result.isValid) {
    // Payment is valid, cloudinaryUrl available
    await confirmPayment(orderNumber, result.cloudinaryUrl, true);
  } else {
    // Show error, ask user to try again
  }
} catch (error) {
  // Network error atau OCR error
}
```

#### 2. **`validatePayment(text, expectedAmount)`**
**File:** `app/lib/payment-verification.ts`

**Purpose:** 3-tier payment validation

```typescript
export function validatePayment(
  text: string, 
  expectedAmount: number
): boolean
```

**What it does:**
- **Check 1:** Verify outlet identifier presence (AYAM JUKUT CABE IJO JKT)
- **Check 2:** Verify success keywords (berhasil, success, lunas, paid, kamu membayar, pembayaran)
- **Check 3:** Amount validation (exact match or ±50 rupiah)

**Return:** `true` if all 3 checks pass, otherwise `false`

**Custom untuk usaha lain:** Edit keywords di function ini

#### 3. **`extractQRISAmount(ocrText)`**
**File:** `app/lib/payment-verification.ts`

**Purpose:** Smart amount extraction menggunakan regex patterns

```typescript
export function extractQRISAmount(ocrText: string): number | null
```

**Strategy:**
1. **Label-based:** Cari pattern seperti "TOTAL: Rp 50.000"
2. **Fallback:** Jika tidak ketemu, ambil angka valid terbesar

**Return:** Extracted amount atau `null` jika tidak dapat extract

#### 4. **`confirmPayment(noOrder, cloudinaryUrl, statusPaid)`**
**File:** `app/lib/payment-verification.ts`

**Purpose:** Submit payment confirmation ke backend dengan retry logic

```typescript
export async function confirmPayment(
  noOrder: string,           // Order number dari sheet
  cloudinaryUrl: string,     // URL dari Cloudinary
  statusPaid: boolean        // Status (selalu true saat success)
): Promise<void>
```

**What it does:**
1. POST ke `/api/proxy/payment` endpoint
2. Backend forward ke Google Apps Script
3. Google Apps Script update sheet
4. Retry mechanism: 5 attempts dengan exponential backoff
5. User-friendly error messages

#### 5. **`generateQrisInfo(amount)`**
**File:** `app/lib/qris-generator.ts`

**Purpose:** Generate QRIS code dinamis berdasarkan nominal

```typescript
export function generateQrisInfo(amount: number) {
  return {
    qrisCode: string,        // QRIS format string
    amountFormatted: string, // "50.000" untuk display
    reference: string,       // Transaction reference number
    timestamp: string        // "09-Apr-2026 14:30:45"
  }
}
```

**Used by:** ConfirmationModal untuk display QRIS

---

### Backend Core Functions (Google Apps Script)

#### 1. **`doGet(e)`** - Handle READ requests

```javascript
function doGet(e) {
  // e.parameter.api = operation ke jalankan
  const api = e.parameter.api;
  
  if (api === 'orders') {
    return getOrders();         // Return semua orders
  } else if (api === 'stock') {
    return getStock();          // Return inventory levels
  } else if (api === 'config') {
    return getConfig();         // Return outlet config
  } // ... other operations
}
```

**Supported APIs:**
- `api=orders` - Get all orders
- `api=stock` - Get current stock levels
- `api=config` - Get outlet operating hours & settings
- `api=orderItemCount` - Get single order detail
- `api=updateStatus` - Update order status

#### 2. **`doPost(e)`** - Handle WRITE requests

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  if (data.type === 'CONFIRM_PAYMENT') {
    // Verify & save payment
    return confirmPayment(data.no_order, data.cloudinary_url);
  } else if (data.type === 'UPDATE_STOCK') {
    // Deduct stock after order
    return updateStock(data.updates);
  } // ... other operations
}
```

**Supported Operations:**
- `CONFIRM_PAYMENT` - Verify payment & update sheet
- `UPDATE_STOCK` - Deduct inventory

---

## 📄 HALAMAN-HALAMAN PENTING

### 1. **Main Ordering Page** (`/`)
**File:** `app/page.tsx` + `app/components/OrderingPage.tsx`

**UI Sections:**
```
┌─────────────────────────────────────┐
│         HEADER + TUTORIAL BUTTON    │  (Fixed top)
├─────────────────────────────────────┤
│                                     │
│      CURRENT STOCK STATUS           │  (Real-time dari API)
│      (Ready/Out of Stock per item)  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  MENU CATEGORIES                    │
│  [Paket] [Non-Paket] [Tambahan]   │
│                                     │
│  MENU ITEMS GRID                    │
│  [Item1] [Item2] [Item3]           │
│  [Price] [@Qty]                    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  FORM SECTION:                     │
│  [Name Input Field]                │
│  [Notes Text Area]                 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ORDER DISPLAY (Current Order)     │
│  Item1  Qty: 2  Rp.32.000         │
│  Item2  Qty: 1  Rp.16.000         │
│  ────────────────────              │
│  TOTAL: Rp. 48.000                │
│                                     │
├─────────────────────────────────────┤
│  [RESET FORM]  [SUBMIT / HITUNG]  │
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- Real-time stock display
- Order total calculation
- localStorage auto-save
- Menu navigation

**Customizable:**
- Menu items & prices `priceMap` di page.tsx
- Categories
- UI colors & styling

### 2. **Confirmation Modal** (Overlay)
**File:** `app/components/ConfirmationModal.tsx`

**UI Sections:**
```
┌─────────────────────────────────┐
│  💳 KONFIRMASI PEMBAYARAN      │
├─────────────────────────────────┤
│                                 │
│  ⚡ PENTING!                    │ (Countdown: 10 detik)
│  • Cek nominal sesuai pesanan  │
│  • Scan & bayar di e-wallet    │
│  • Simpan bukti pembayaran     │
│                                 │
│  QRIS akan muncul dalam         │ (Countdown: 5,4,3...)
│         5                        │
│  Harap tunggu sebentar...       │
│                                 │
│  📱 Cara Bayar:                 │
│  Buka e-wallet → Scan QRIS ... │
│                                 │
├─────────────────────────────────┤
│  [BATAL]  [SUDAH BAYAR]        │ (Enable after 10s)
└─────────────────────────────────┘
```

**Timeline:**
- t=0s: Modal terbuka, countdown dimulai
- t=5s: QRIS code muncul
- t=10s: Tombol "SUDAH BAYAR" enabled
- User bisa klik sebelum countdown selesai jika sudah bayar

**Customizable:**
- Countdown duration (line 32-33)
- QRIS display style
- Payment instructions text

### 3. **Alert Modal** (Payment Verification)
**File:** `app/components/AlertModal.tsx`

**UI Sections When Payment Not Verified:**
```
┌──────────────────────────────────┐
│  🎉 PESANAN BERHASIL            │
├──────────────────────────────────┤
│                                  │
│  Pesanan Anda dikirim!          │
│  Silakan upload bukti pembayaran │
│                                  │
│  📤 [UPLOAD BUKTI PEMBAYARAN]   │ (Step 1)
│  File input, trigger OCR locally │
│                                  │
│  ✔️ VERIFIKASI PEMBAYARAN ...   │ (Status after upload)
│  ❌ GAGAL / ✅ BERHASIL         │
│                                  │
│  🔒 TERUSKAN PESANAN            │ (Button disabled)
│  (Tunggu verifikasi pembayaran) │
│                                  │
├──────────────────────────────────┤
│  [CLOSE]                         │
└──────────────────────────────────┘
```

**UI Sections When Payment Verified:**
```
┌──────────────────────────────────┐
│  ✅ Pembayaran Terverifikasi     │
├──────────────────────────────────┤
│                                  │
│  📤 UPLOAD BUKTI PEMBAYARAN      │ (Disabled, showing checkmark)
│  ✅ Pembayaran berhasil diverifikasi
│                                  │
│  💬 [TERUSKAN PESANAN]          │ (Enabled, green button)
│  (Buka WhatsApp & refresh page) │
│                                  │
│  ─────────────────────────────   │
│  📋 Pesan yang akan dikirim:    │
│  !!JANGAN UBAH PESAN INI!!      │
│  ORD-0001                       │
│  ...                            │
│  Bukti Pembayaran: [link]       │
│                                  │
│  [📋 SALIN PESAN]               │
│                                  │
├──────────────────────────────────┤
│  📱 Hubungi Admin: +62...       │
└──────────────────────────────────┘
```

**Flow:**
1. Display form section (upload, status)
2. After OCR validation → Status message
3. If valid → Show WhatsApp message + button
4. Button click → Open wa.me + clear localStorage + refresh

### 4. **Payment Proof Page** (`/payment-proof?url=...&order=...`)
**File:** `app/payment-proof/page.tsx`

**Purpose:** Shareable link dengan Open Graph meta tags untuk WhatsApp thumbnail

**UI:**
```
┌─────────────────────────────────┐
│                                 │
│   ✅ BUKTI PEMBAYARAN          │
│                                 │
│   Pesanan: ORD-0001            │
│   Status: Dikonfirmasi         │
│                                 │
│   [IMAGE DISPLAY]              │  (From Cloudinary URL)
│                                 │
│   Terima kasih telah memesan!  │
│   Admin akan segera memproses.  │
│                                 │
└─────────────────────────────────┘
```

**Open Graph Tags:**
```html
<meta property="og:image" content="{cloudinary-url}" />
<meta property="og:title" content="Bukti Pembayaran - ORD-0001" />
<meta property="og:description" content="Bukti pembayaran pesanan Anda..." />
```

**Usage:** Shared di WhatsApp untuk thumbnail preview

### 5. **Closed Page** (`/closed`)
**File:** `app/closed/page.tsx`

**Purpose:** Maintenance/closed mode notification

**Customizable:**
- Image/video background
- Message text
- Opening hours display

---

## 🎨 CUSTOMIZATION GUIDE

### A. MENU & PRICING CUSTOMIZATION

#### Step 1: Update Price Map
**File:** `app/page.tsx` (Line ~20)

```typescript
const priceMap: { [key: string]: number } = {
  // Format: 'KODE_ITEM': harga_dalam_rupiah
  
  // PAKET
  'PKT PA': 16000,      // Paket Paha Atas
  'PKT PB': 16000,      // Paket Paha Bawah
  'PKT DD': 16000,      // Paket Dada
  
  // NON-PAKET
  'NP PA': 12000,       // Non-Paket Paha Atas
  'NP PB': 12000,
  
  // TAMBAHAN
  'EXT NDJ': 6000,      // Nasi Daun Jeruk
  'EXT NSP': 5000,      // Nasi Putih
};
```

**To add new item:**
```typescript
'PKT BARU': 20000,      // Your new package
```

#### Step 2: Update Item Code Map
**File:** `app/page.tsx` (Line ~35)

```typescript
const itemCodeToNameMap: { [key: string]: string } = {
  // Format: 'SUFFIX': 'FULL_NAME_FOR_DISPLAY'
  'PA': 'PAHA ATAS',
  'PB': 'PAHA BAWAH',
  // ... semua kode
};
```

#### Step 3: Update Category Display
**File:** `app/components/OrderButtonGrid.tsx`

```typescript
const categories = [
  { id: 'paket', label: 'PAKET', color: 'from-blue-500 to-cyan-500' },
  { id: 'non_paket', label: 'NON-PAKET', color: 'from-purple-500 to-pink-500' },
  { id: 'tambahan', label: 'TAMBAHAN', color: 'from-orange-500 to-red-500' },
];

// Map item codes ke categories
const categoryMap: { [key: string]: string } = {
  'ITEM_CODE': 'category_id',
  'PKT PA': 'paket',
  'NP PA': 'non_paket',
  'EXT NDJ': 'tambahan',
};
```

#### Step 4: Update Google Sheets
**File:** Google Sheets "Stok outlet Cempaka"

Tambah baris baru untuk setiap item:
| nama_item | stok | kategori |
|-----------|------|----------|
| PAHA ATAS | 20   | paket    |
| PAHA BAWAH| 30   | paket    |
| ... | ... | ... |

### B. OUTLET INFORMATION CUSTOMIZATION

#### Step 1: Edit Operating Hours
**File:** `app/lib/settings.ts`

```typescript
// Change default opening times
export const DEVELOPER_MODE = false;  // Set false for production
export const CLOSED_PAGE_STATUS = 'off';  // 'on' to enable closed page
```

#### Step 2: Edit Google Apps Script Config Sheet
**File:** Google Sheets Tab "Config"

| jamBuka | jamTutup | maxOrders | outletName |
|---------|----------|-----------|-----------|
| 10:00   | 15:30    | 15        | AYAM JUKUT CABE IJO |

**Modify:**
- `jamBuka`: Opening time (format: "HH:MM")
- `jamTutup`: Closing time
- `maxOrders`: Max concurrent orders allowed
- `outletName`: Outlet display name

#### Step 3: Update Validation Keywords
**File:** `app/lib/payment-verification.ts` (Line ~260)

```typescript
// Check 1: Outlet identifier
const outletKeywords = [
  'ayam jukut cabe ijo',  // Custom keyword 1
  'ayam jukut',           // Custom keyword 2
  'cabe ijo',             // Custom keyword 3
  'jkt'                   // Custom keyword 4
];

// Check 2: Success keywords
const successKeywords = [
  'berhasil', 'success', 'lunas', 'paid',
  'kamu membayar', 'pembayaran'  // Add more if needed
];
```

### C. UI/STYLING CUSTOMIZATION

#### Step 1: Colors & Branding
**File:** `app/globals.css`

```css
/* Add custom color variables */
:root {
  --primary-color: #10b981;      /* Emerald green */
  --secondary-color: #6366f1;    /* Indigo */
  --accent-color: #f59e0b;       /* Amber */
}
```

#### Step 2: Tailwind Theme
**File:** `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#10b981',
        'brand-secondary': '#6366f1',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
};
```

#### Step 3: Component Styling
**File:** Each component file (e.g., `AlertModal.tsx`)

```typescript
// Update Tailwind classes
className={`
  bg-gradient-to-r 
  from-YOUR_COLOR-500 
  to-YOUR_COLOR-600
  ...
`}
```

### D. WHATSAPP MESSAGE TEMPLATE

**File:** `app/page.tsx` (Line ~315)

```typescript
let waMessage = `!!JANGAN UBAH PESAN INI!!\n\n`;
waMessage += `${orderNumber}\n\n`;
waMessage += `Pesanan pada jam ${timeString}\ndengan Nama ${name},\n\n`;
waMessage += `${orderDetailsString}\n\n`;
waMessage += `Note : ${note}\n`;
waMessage += `total ${total.toLocaleString('id-ID')}\n\n`;
waMessage += `Pembayaran QRIS\n\n`;

// Customize dengan mengedit string format di atas
```

**Template Variables:**
- `${orderNumber}` - Auto-generated order ID
- `${timeString}` - Order time
- `${name}` - Customer name
- `${orderDetailsString}` - Item breakdown
- `${note}` - Special notes
- `${total}` - Total amount

### E. PAYMENT VERIFICATION SETTINGS

#### Amount Tolerance
**File:** `app/lib/payment-verification.ts` (Line ~290)

```typescript
// Change tolerance (default: 50 rupiah)
if (difference <= 50) {  // Change 50 to your tolerance
  console.log(`✅ MATCH (within ${tolerance} rupiah)`);
  return true;
}
```

#### Min/Max Amount Range
**File:** `app/lib/payment-verification.ts` (Line ~85)

```typescript
function isValidAmount(amount: number): boolean {
  // Change range as needed
  if (amount < 1000 || amount > 500000) return false;  // Min: 1000, Max: 500000
  if (amount.toString().length > 6) return false;
  return true;
}
```

---

## 🔄 KONFIGURASI UNTUK USAHA LAIN

### Template Adaptation Checklist

Untuk menggunakan template ini untuk usaha lain (tidak hanya ayam jukut), ikuti checklist ini:

#### 1. BUSINESS INFORMATION ✓
- [ ] Update outlet name di Google Sheets Config
- [ ] Update operating hours (jam buka/tutup)
- [ ] Update max orders limit
- [ ] Update outlet keywords untuk validation

#### 2. MENU SETUP ✓
- [ ] Delete existing menu items dari `priceMap`
- [ ] Add new menu items dengan harga
- [ ] Create new categories (optional)
- [ ] Update Google Sheets "Stok" dengan inventory

#### 3. BRANDING ✓
- [ ] Update colors di `tailwind.config.js`
- [ ] Update logo/images di `public/` folder
- [ ] Update WhatsApp message template
- [ ] Update closed page messaging

#### 4. PAYMENT VALIDATION ✓
- [ ] Update outlet keywords untuk payment validation
- [ ] Adjust amount tolerance jika perlu
- [ ] Add payment success keywords spesifik untuk business

#### 5. GOOGLE SETUP ✓
- [ ] Create Google Form untuk order submission
- [ ] Create Google Sheet dengan structure:
  - Tab "Form Responses 1" (orders)
  - Tab "Stok" (inventory)
  - Tab "Config" (settings)
- [ ] Deploy Google Apps Script (update URL)

#### 6. THIRD-PARTY SERVICES ✓
- [ ] Create Cloudinary account (free tier available)
- [ ] Setup Cloudinary upload preset
- [ ] Update `CLOUDINARY_CLOUD_NAME` di `settings.ts`

#### 7. ADMIN WHATSAPP ✓
- [ ] Update admin phone number di code
- [ ] Test WhatsApp deep linking

#### 8. TESTING ✓
- [ ] Test order flow end-to-end
- [ ] Test payment verification dengan dummy images
- [ ] Test stock deduction
- [ ] Test localStorage persistence
- [ ] Test mobile responsiveness

---

## 📡 API DOCUMENTATION

### Frontend → Backend Communication

#### 1. Get Stock Levels
**Endpoint:** `/api/proxy/stock`  
**Method:** GET  
**Backend Handler:** Google Apps Script `doGet(api=stock)`

**Response:**
```json
[
  {
    "nama_item": "PAHA ATAS",
    "stok": 20,
    "kategori": "paket"
  },
  // ... more items
]
```

#### 2. Get Outlet Configuration
**Endpoint:** `/api/proxy/config`  
**Method:** GET  
**Backend Handler:** Google Apps Script `doGet(api=config)`

**Response:**
```json
{
  "jamBuka": "10:00",
  "jamTutup": "15:30",
  "maxOrders": 15,
  "outletName": "AYAM JUKUT CABE IJO"
}
```

#### 3. Get All Orders
**Endpoint:** `/api/proxy/stock?api=orders`  
**Method:** GET  
**Backend Handler:** Google Apps Script `doGet(api=orders)`

**Response:**
```json
[
  {
    "no_order": "ORD-0001",
    "name": "John",
    "order": "PKT PA 2\nEXT NSP 1",
    "total": 48000,
    "waktu": "2026-04-09T14:30:00",
    "status": "completed",
    "payment_status": true,
    "cloudinary_url": "https://res.cloudinary.com/..."
  },
  // ... more orders
]
```

#### 4. Confirm Payment
**Endpoint:** `/api/proxy/payment`  
**Method:** POST  
**Backend Handler:** Google Apps Script `doPost()` with type=CONFIRM_PAYMENT

**Request Body:**
```json
{
  "type": "CONFIRM_PAYMENT",
  "no_order": "ORD-0001",
  "cloudinary_url": "https://res.cloudinary.com/...",
  "status_paid": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed and saved",
  "order": "ORD-0001"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Order not found"
}
```

#### 5. Update Stock
**Endpoint:** `/api/proxy/stock` (via CORS no-cors mode in background)  
**Method:** POST  
**Backend Handler:** Google Apps Script `doPost()` with type=UPDATE_STOCK

**Request Body:**
```json
{
  "updates": [
    {
      "nama_item": "PAHA ATAS",
      "quantity": 2
    },
    {
      "nama_item": "NASI DAUN JERUK",
      "quantity": 1
    }
  ]
}
```

### Error Handling

#### Common Errors & Solutions

**1. NetworkError when attempting to fetch**
- Cause: CORS blocking
- Solution: Ensure `/api/proxy/*` routes are used

**2. Payment confirmation timeout**
- Cause: Google Apps Script slow response
- Solution: Auto-retry mechanism (5 attempts, exponential backoff)

**3. OCR confidence too low**
- Cause: Blurry/bad quality image
- Solution: Ask user to upload clear image

**4. Amount mismatch**
- Cause: OCR extracted wrong amount
- Solution: Fallback to manual input or reject

---

## 💳 PAYMENT INTEGRATION

### Current Setup: QRIS

#### What is QRIS?
- **Quick Response Code Indonesian Standard** - Standard QR code untuk payment di Indonesia
- Supported oleh semua e-wallet: GCash, OVO, Dana, LinkAja, Gopay, OVO, etc.
- Dynamic amount support

#### How it Works in This App

1. **QRIS Generation:**
   - Amount input → QRIS code generated dynamically
   - QRIS code display dalam countdown modal

2. **Payment by User:**
   - Scan QR code dengan e-wallet
   - e-wallet verifikasi amount
   - User bayar & terima receipt

3. **Payment Verification:**
   - User upload receipt screenshot
   - OCR extract amount dari receipt
   - Validate: Outlet ID → Keywords → Amount
   - If valid: Save ke database

### Alternative Payment Methods

Untuk add alternative payment methods (e.g., Cash, Bank Transfer):

#### Option 1: Direct Bank Transfer
**Modification:**
1. Add bank account info ke Confirmation Modal
2. Skip payment verification (trust-based)
3. Mark as "awaiting verification" di database
4. Admin manually verify later

#### Option 2: Credit Card / Online Payment Gateway
**Integration Steps:**
1. Replace QRIS code dengan payment gateway (Stripe, Midtrans, etc.)
2. User fill payment form → redirect to payment gateway
3. Payment gateway redirect back after success/failure
4. Auto-update database dengan payment status

#### Option 3: COD (Cash on Delivery)
**Modification:**
1. Skip payment modal entirely
2. Mark order as "payment due on delivery"
3. Display payment info at checkout

---

## 🚀 DEPLOYMENT & PRODUCTION

### Hosting Options

#### Option 1: Vercel (Recommended)
- Free tier available
- One-click deploy from GitHub
- Automatic deployments on push
- Built-in analytics
- Good for Next.js

**Steps:**
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Click Deploy
4. Get live URL

#### Option 2: Self-Hosted (VPS)
- More control
- Required: Node.js, npm, PM2
- Recommended providers: DigitalOcean, Linode, AWS

**Steps:**
```bash
# SSH into server
ssh user@server-ip

# Clone repository
git clone <repo-url>
cd order-jukut-online-main

# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2 (process manager)
pm2 start "npm start" --name "order-app"

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

#### Option 3: Netlify
- Similar to Vercel
- Free tier with good limits
- Serverless functions support

### Pre-Deployment Checklist

- [ ] Set `DEVELOPER_MODE = false` di `settings.ts`
- [ ] Update Google Apps Script deployment URL
- [ ] Verify Google Sheets access (shares with script owner)
- [ ] Test all API endpoints
- [ ] Verify Cloudinary credentials
- [ ] Setup domain (optional)
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Test payment flow end-to-end
- [ ] Test on multiple devices & browsers
- [ ] Setup analytics (optional: Google Analytics)
- [ ] Create backup of Google Sheets data

### Environment Variables

**File:** `.env.local` (create if not exists)

```bash
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Google Apps Script
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXX
```

### Performance Optimization

1. **Image Optimization:**
   - Use Cloudinary for all images
   - Auto-resize & compress
   - Lazy load images

2. **Code Splitting:**
   - Next.js automatic code splitting
   - Dynamic imports untuk heavy components

3. **Caching:**
   - localStorage untuk order persistence
   - API response caching

4. **Database Optimization:**
   - Google Sheets bukan ideal untuk high load
   - Alternative untuk scale: Firebase, MongoDB

---

## 🛠️ TROUBLESHOOTING

### Common Issues & Solutions

#### Issue 1: CORS Error from Google Apps Script
**Error:** `NetworkError when attempting to fetch resource`

**Solution:**
- Ensure `/api/proxy/*` endpoint is used
- Check Google Apps Script URL is correct
- Verify Google Apps Script is deployed (not in editor)

#### Issue 2: OCR Not Recognizing Text
**Error:** `Could not extract any valid amount from OCR`

**Solution:**
- Image must be clear & readable
- Check image resolution (min 200x200)
- Try with uploaded screenshot directly
- May fail on blurry/low-quality images

#### Issue 3: Payment Not Saving to Google Sheets
**Error:** `Payment confirmation failed`

**Solution:**
- Check Google Sheets permissions
- Verify Google Apps Script authorization
- Check network connectivity
- Check browser console for detailed error
- Retry mechanism should auto-retry 5 times

#### Issue 4: Stock Not Deducting
**Error:** Order placed but stock unchanged

**Solution:**
- Verify stock sheet structure
- Check item names match exactly
- Google Apps Script may error silently (check logs)

#### Issue 5: localStorage Not Persisting
**Error:** Order lost after refresh

**Solution:**
- Check browser localStorage is enabled
- Check storage quota not exceeded
- Try different browser
- Clear cache & retry

---

## 📚 ADDITIONAL RESOURCES

### Files to Read for More Details
- `README.md` - Project overview
- `DOKUMENTASI.md` - Original Indonesian documentation
- `spreadsheet-script.gs` - Backend logic

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Apps Script](https://developers.google.com/apps-script)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [Cloudinary](https://cloudinary.com/documentation)

### Support & Questions
- Check GitHub Issues for common problems
- Review code comments for implementation details
- Test in development mode before production

---

## 📝 CHANGELOG

### Version 1.0 - April 9, 2026
- ✅ Initial production release
- ✅ Payment verification system complete
- ✅ QRIS code generation
- ✅ OCR-based amount validation
- ✅ Outlet identifier verification
- ✅ WhatsApp integration
- ✅ localStorage persistence
- ✅ Cloudinary image hosting
- ✅ Complete documentation

---

**Last Updated:** April 9, 2026  
**Status:** Production Ready ✅  
**Maintained by:** Development Team

---

## 🎓 TIPS FOR CUSTOMIZATION

### Do's ✅
- DO test changes locally before deploying
- DO backup Google Sheets before major changes
- DO version control your changes (Git)
- DO read through code comments
- DO test payment flow end-to-end
- DO setup error monitoring in production

### Don'ts ❌
- DON'T edit Google Apps Script without backup
- DON'T change database column order without updating code
- DON'T expose secrets in frontend code
- DON'T test payments with real money
- DON'T deploy without testing
- DON'T delete localStorage clearing logic if you want persistence

---

**Selamat menggunakan template Web Order Online!** 🚀

Untuk pertanyaan atau bantuan, silakan refer ke dokumentasi ini atau check kode comments.
