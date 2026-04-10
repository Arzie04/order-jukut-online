This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Main Documentation

- `TEMPLATE_SETUP_GUIDE.md` - Panduan detail untuk memakai repo ini sebagai template usaha lain
- `CURRENT_OPERATIONS_REFERENCE.md` - Referensi link, endpoint, dan setup aktif Jukut saat ini

## Recent Updates (April 9, 2026)

### New Features
- **Enhanced Google Apps Script**: Updated with new API endpoints including `orderItemCount` and `updateStatus`
- **Order Item Count API**: New endpoint to track daily order statistics and item counts
- **Order Status Management**: Added functionality to update order status through API calls
- **Improved Payment Confirmation**: Enhanced doPost handling for payment confirmation with better error handling
- **Dynamic QRIS Code Generation**: Automatic QR code generation with CRC-16/CCITT validation for each order, injecting the exact nominal amount into the QRIS code
- **Price Updates**: All items increased by Rp1,000 (except Tahu and Tempe which remain at Rp1,000)
- **WhatsApp Integration**: Direct WhatsApp messaging with pulse border animations and copy-to-clipboard functionality
- **Announcement Modal**: New 3-page onboarding modal displaying store hours, important notes, and announcements

### UI/UX Improvements
- **Desktop Responsiveness**: Optimized AlertModal and ConfirmationModal for desktop screens with proper scaling and sizing
- **Mobile First Design**: Maintained responsive mobile experience while enhancing desktop layout
- **Animations**: Added smooth pulse-border, blink-glow, and shockwave animations for better user engagement
- **Clear Payment Instructions**: Step-by-step guidance for QRIS payment and WhatsApp confirmation

### Technical Updates
- Added `qris-generator.ts` for dynamic QRIS generation with EMV QRCPS format
- Improved modals with `max-h-[90vh]` viewport constraints
- Enhanced accessibility and visual hierarchy across all modal components

### Removed Features
- Removed "Lihat Menu" button (no longer needed)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Configuration

This application uses Google Sheets as a database through Google Apps Script. The configuration is as follows:

### Google Sheets Database
- **Spreadsheet ID**: `1pKnLsQ-hs1uWfEpyd4rkde0abNx0PtiikB1aAptcJGU`
- **Stock Sheet**: "Stok outlet Cempaka" (Sheet 2)
- **Orders Sheet**: "Orders" (adjust name as needed)
- **Config Sheet**: "Config" (adjust name as needed)

### Google Apps Script Setup

1. Open your Google Spreadsheet (`1pKnLsQ-hs1uWfEpyd4rkde0abNx0PtiikB1aAptcJGU`)
2. Click **Extensions > Apps Script**
3. Delete the default code and copy the entire content from `spreadsheet-script.gs` in this repository
4. Save the project (Ctrl+S or Cmd+S)
5. Deploy as a web app:
   - Click **Deploy > New deployment**
   - Choose type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
6. Copy the web app URL and update it in the frontend components if needed

**Important Notes:**
- The script is now directly embedded in the spreadsheet, eliminating the need for a separate Google Apps Script project
- This approach reduces NetworkError issues as the script runs in the same context as the spreadsheet
- The script includes better error handling and supports batch stock updates

### Sheet Structure

**Stok outlet Cempaka Sheet:**
- Column A: id_item (e.g., "PKT PA", "PKT PB")
- Column B: nama_item (item name)
- Column C: stok (stock quantity)
- Column D: status ("Tersedia", "Hampir Habis", "Terjual Habis")
- Column E: catatan (notes)

**Form Responses 1 Sheet (Orders):**
- Column A: waktu (timestamp)
- Column B: nama (customer name)
- Column C: pesanan (order details)
- Column D: note (customer notes)
- Column E: total (total amount)
- Column F: no_order (order number)
- Column G: paid (payment status - boolean)
- Column H: (reserved)
- Column I: status (order status - "terbaru", "diproses", "selesai", etc.)
- Column J: cloudinary_url (payment proof image URL)

**Config Sheet:**
- Column A: key (jam_buka, jam_tutup, max_pesanan)
- Column B: value (corresponding values)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
