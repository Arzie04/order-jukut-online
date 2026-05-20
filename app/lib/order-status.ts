/**
 * Centralized order status → UX-friendly message mapping.
 * Never expose raw backend/spreadsheet status strings to end users.
 */
export function mapOrderStatusMessage(rawStatus: string): string {
  const status = String(rawStatus || '').trim();
  const normalized = status.toLowerCase();

  if (!status) {
    return 'Status pesanan belum tersedia. Silakan cek lagi nanti.';
  }

  if (normalized.includes('pesanan sudah diantar')) {
    return 'Pesanan sudah selesai diantar';
  }

  if (normalized.includes('sedang diantar oleh driver')) {
    return 'Pesanan sedang diantar';
  }

  if (normalized.includes('assigned_driver')) {
    return 'Pesanan sudah diambil driver dan menunggu pengantaran';
  }

  if (normalized === 'terbaru') {
    return 'Pesanan sudah masuk dan segera disiapkan';
  }

  if (normalized === 'disiapkan' || normalized === 'disiapkan-printed') {
    return 'Pesanan sedang disiapkan';
  }

  if (normalized === 'siap') {
    return 'Pesanan sudah siap dan bisa diambil';
  }

  if (normalized === 'selesai') {
    return 'Pesanan sudah selesai / diambil';
  }

  // Legacy pickup wording fallback
  if (normalized.includes('sudah disiapkan') && normalized.includes('diambil')) {
    return 'Pesanan sudah siap dan bisa diambil';
  }

  return 'Status pesanan sedang diperbarui. Silakan cek lagi dalam beberapa menit.';
}
