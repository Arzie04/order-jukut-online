# 🔧 QUICK CUSTOMIZATION REFERENCE
## Cheat Sheet untuk Modify Web Order Online

Panduan super cepat untuk mengubah web ini sesuai kebutuhan bisnis.

---

## 📋 CHECKLIST CUSTOMIZATION (5 MENIT)

### 1. UBAH NAMA OUTLET
```
File: Google Sheets "Config" Tab
Cell: outletName = "NAMA OUTLET ANDA"

File: app/lib/payment-verification.ts
Line: 262 - Update outletKeywords array
```

### 2. UBAH JAM OPERASIONAL
```
File: Google Sheets "Config" Tab
jamBuka = "08:00"      // jam buka
jamTutup = "21:00"     // jam tutup
maxOrders = 20         // max pesanan bersamaan
```

### 3. UBAH MENU & HARGA
```
File: app/page.tsx
Line: 20 - Modify priceMap dictionary

SEBELUM:
'PKT PA': 16000,

SESUDAH:
'PKT BARU': 25000,
```

### 4. UBAH KATEGORI MENU
```
File: app/components/OrderButtonGrid.tsx
Line: 10 - Modify categories array

const categories = [
  { id: 'kategori_baru', label: 'NAMA KATEGORI', color: '...' },
];
```

### 5. UBAH STOK INVENTORY
```
File: Google Sheets "Stok" Tab (tambah/hapus baris)

| nama_item | stok | kategori |
|-----------|------|----------|
| ITEM ANDA | 50   | kategori |
```

---

## 🎨 STYLING (10 MENIT)

### Ubah Warna Utama
```
File: tailwind.config.js (Line: 20+)

Ubah dari 'emerald' ke warna lain:
- 'blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow'

Contoh ubah ke BLUE:
className="bg-blue-600 hover:bg-blue-700"
```

### Ubah Font Size
```
Tailwind sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl...

Contoh:
SEBELUM: className="text-2xl font-bold"
SESUDAH: className="text-3xl font-bold"
```

### Ubah Spacing
```
Tailwind spacing: p-4, p-6, m-2, space-y-4, gap-4...

Contoh:
SEBELUM: <div className="p-4">
SESUDAH: <div className="p-8">  // lebih besar
```

---

## 💳 PAYMENT CUSTOMIZATION (5 MENIT)

### Ubah Outlet Identifier Validation
```
File: app/lib/payment-verification.ts
Line: 262

SEBELUM:
const outletKeywords = ['ayam jukut cabe ijo', 'ayam jukut', 'cabe ijo', 'jkt'];

SESUDAH (Untuk bisnis lain):
const outletKeywords = ['nama bisnis', 'singkatan', 'kota'];
```

### Ubah Success Keywords
```
File: app/lib/payment-verification.ts
Line: 273

SEBELUM:
const successKeywords = ['berhasil', 'success', 'lunas', 'paid', 'kamu membayar', 'pembayaran'];

SESUDAH (Tambah jika perlu):
const successKeywords = [..., 'keyword baru', 'keyword lain'];
```

### Ubah Amount Tolerance
```
File: app/lib/payment-verification.ts
Line: 297

SEBELUM: if (difference <= 50) {  // 50 rupiah

SESUDAH: if (difference <= 100) {  // 100 rupiah (lebih toleran)
```

---

## 📱 UI/TEXT CUSTOMIZATION (10 MENIT)

### Ubah Judul Modal
```
File: app/components/ConfirmationModal.tsx
Line: 73
<h5 className="text-3xl font-bold">💳 Konfirmasi Pembayaran</h5>

Ubah ke:
<h5 className="text-3xl font-bold">💳 Bayar Sekarang</h5>
```

### Ubah Instruksi
```
File: app/components/ConfirmationModal.tsx
Line: 95+

SEBELUM:
<li>Cek nominal sesuai pesanan</li>

SESUDAH:
<li>Pastikan jumlah yang dibayarkan benar</li>
```

### Ubah Template Message WhatsApp
```
File: app/page.tsx
Line: 315+

let waMessage = `!!JANGAN UBAH PESAN INI!!\n\n`;
waMessage += `${orderNumber}\n\n`;
// ... modify text sesuai kebutuhan
```

### Ubah Nomor WhatsApp Admin
```
File: Cari di kode: "62882007448066"

SEBELUM: 62882007448066
SESUDAH: 62811XXXXXXXX (nomor admin baru)
```

---

## 🔧 CODE QUICK FIXES

### Tambah Menu Item Baru
```typescript
// File: app/page.tsx - Line 20 (priceMap)
'PKT AYAM KAMPUNG': 18000,  // Item baru

// File: app/page.tsx - Line 35 (itemCodeToNameMap)
'AYAM KAMPUNG': 'AYAM KAMPUNG',

// File: Google Sheets "Stok" Tab
// Tambah baris baru dengan nama AYAM KAMPUNG dan stok initial
```

### Ubah Category Filter
```typescript
// File: app/components/OrderButtonGrid.tsx
// Find categoryMap dan update mapping:

const categoryMap: { [key: string]: string } = {
  'ITEM_CODE': 'category_id',
  'PKT AYAM KAMPUNG': 'paket',  // Assign ke kategori
};
```

### Disable Tutorial (Untuk Simplify)
```typescript
// File: app/components/OrderingPage.tsx
// Comment out atau delete:

// <TutorialModal isOpen={showTutorial} ... />
```

### Disable Stock Display (Jika tidak perlu)
```typescript
// File: app/components/OrderingPage.tsx
// Comment out:

// <StockDisplay stock={stock} />
```

---

## 🔑 ENVIRONMENT VARIABLES

**File:** `.env.local` (buat di root jika belum ada)

```bash
# Required
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Optional
NEXT_PUBLIC_ADMIN_PHONE=62811XXXXXXXX
```

---

## 📊 GOOGLE SHEETS STRUCTURE

### Tab 1: "Form Responses 1" (Orders)
```
Columns:
A: waktu (timestamp)
B: no_order (auto-generated)
C: name (customer name)
D: order (items list)
E: total (order total)
F: status (order status)
G: payment_status (TRUE/FALSE)
H: (reserved)
I: (reserved)
J: cloudinary_url (payment proof URL)
```

### Tab 2: "Stok" / "Stok outlet Cempaka" (Inventory)
```
Columns:
A: nama_item (item name)
B: stok (current stock count)
C: kategori (category: paket/non_paket/tambahan)
D: (optional: last_updated)
```

### Tab 3: "Config" (Settings)
```
Columns:
A: jamBuka (opening time)
B: jamTutup (closing time)
C: maxOrders (max concurrent orders)
D: outletName (business name)
E: (optional: phone)
F: (optional: address)
```

---

## 🚀 DEPLOYMENT QUICK STEPS

### Option 1: Vercel (30 seconds)
```bash
# Login to Vercel.com dengan GitHub account
# Connect repository ke Vercel
# Click "Deploy"
# Done! Get live URL
```

### Option 2: Self-Hosted
```bash
# SSH ke server
ssh user@server-ip

# Clone & setup
git clone <repo>
cd order-app
npm install
npm run build

# Run dengan PM2
npm install -g pm2
pm2 start "npm start"
pm2 startup
pm2 save
```

---

## 🪛 LOCAL DEVELOPMENT

### Setup Lokal
```bash
# Clone repo
git clone <repo>
cd order-app

# Install dependencies
npm install

# Buat .env.local dan add:
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
# NEXT_PUBLIC_APPS_SCRIPT_URL=...

# Run development server
npm run dev

# Open http://localhost:3000
```

### Development Mode
- Set `DEVELOPER_MODE = true` di `settings.ts`
- Tidak ada time restrictions (bisa test kapan saja)
- Check browser console untuk logs

### Testing
```bash
npm run build      # Build untuk production
npm run lint       # Check untuk errors
npm start          # Run production build locally
```

---

## 📞 WHATSAPP NUMBERS

Tempat-tempat admin phone number dipakai:

```
1. AlertModal.tsx (Line: 343)
   "📱 Hubungi Admin Jika Ada Kendala"
   <p className="...">+62 882-0074-48066</p>

2. page.tsx (Line: ~350)
   wa.me link destination
   https://wa.me/62882007448066

3. Google Sheets Config
   Optional field untuk phone
```

**Untuk ubah:**
1. Replace nomor di AlertModal.tsx
2. Replace nomor di page.tsx (no leading 0, format: 62XXXXX)
3. Ensure number has WhatsApp

---

## 🔒 SECURITY NOTES

### Do's ✅
- Backup Google Sheets regularly
- Use strong passwords untuk Google account
- Keep Google Apps Script deployment URL secret
- Test in development before production

### Don'ts ❌
- Don't expose Google Apps Script URL di client code (it's public, OK)
- Don't hardcode secrets di code
- Don't test payments dengan real money
- Don't delete without backup

---

## 🐛 DEBUGGING

### View console logs
```
Browser → F12 → Console tab
Watch untuk:
- "Starting payment verification..."
- "Payment verification result:"
- Errors dalam red
```

### Check Network Tab
```
Browser → F12 → Network tab
Look for:
- /api/proxy/stock (should be 200)
- /api/proxy/config (should be 200)
- /api/proxy/payment (should be 200)
```

### Google Apps Script Logs
```
apps.script.google.com
→ Select project
→ Executions tab
→ View logs
```

---

## 📝 COMMON CUSTOMIZATIONS SUMMARY

| Customization | File | Line | What to Change |
|---------------|------|------|----------------|
| Add menu item | page.tsx | 20 | Add to priceMap |
| Add category | OrderButtonGrid.tsx | 10 | Add to categories |
| Change colors | tailwind.config.js | 20+ | Update colors |
| Change hours | Config Sheet | - | jamBuka/jamTutup |
| Change outlet name | settings.ts | - | outletKeywords |
| Change payment keywords | payment-verification.ts | 273 | successKeywords |
| Change admin phone | AlertModal.tsx | 343 | Phone number |
| Disable tutorial | OrderingPage.tsx | - | Comment out component |
| Change tolerance | payment-verification.ts | 297 | difference <= X |

---

## 🎓 LEARNING PATH

**Recommended order untuk belajar:**

1. **Read:** TEMPLATE_CUSTOMIZATION_GUIDE.md (full docs)
2. **Understand:** Architecture overview & data flow
3. **Code Read:** app/page.tsx (main logic)
4. **Code Read:** app/lib/payment-verification.ts (payment logic)
5. **Code Read:** spreadsheet-script.gs (backend)
6. **Try:** Make small change (e.g., menu item)
7. **Deploy:** Push to Vercel & test

---

## ❓ FAQ

**Q: Gimana kalau mau tambah kategori baru?**
A: Modify categoryMap di OrderButtonGrid.tsx, tambah kategori definition, update priceMap untuk items baru.

**Q: Bisa ga pakai database lain selain Google Sheets?**
A: Bisa! Perlu modify Google Apps Script untuk connect ke database baru (Firebase, MongoDB, etc).

**Q: Gimana kalau mau offline payment (cash)?**
A: Bypass payment verification modal, skip OCR validation, mark sebagai "pending verification".

**Q: Bisa SMS notifications?**
A: Perlu integrate SMS service (Twilio, etc) ke Google Apps Script.

**Q: Template ini bisa untuk e-commerce lain?**
A: Ya! Struktur generic cukup. Perlu customize menu/pricing/payment validation.

---

**Need more help?** Check TEMPLATE_CUSTOMIZATION_GUIDE.md untuk detail lebih lengkap!

**Selamat customize!** 🚀
