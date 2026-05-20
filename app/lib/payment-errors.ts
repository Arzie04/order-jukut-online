export type PaymentErrorKind = 'system' | 'invalid_image';

export interface PaymentErrorPresentation {
  kind: PaymentErrorKind;
  title: string;
  message: string;
  showRefresh: boolean;
  showRetry: boolean;
}

function isSystemErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('timeout') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('koneksi') ||
    lower.includes('server') ||
    lower.includes('abort') ||
    lower.includes('cloudinary') ||
    lower.includes('upload') ||
    lower.includes('api error') ||
    lower.includes('http 5') ||
    lower.includes('http 502') ||
    lower.includes('http 504') ||
    lower.includes('konfigurasi') ||
    lower.includes('tidak ditemukan di database') ||
    lower.includes('gagal mengkonfirmasi')
  );
}

export function classifyPaymentError(error: unknown): PaymentErrorPresentation {
  const raw = error instanceof Error ? error.message : String(error || '');

  if (isSystemErrorMessage(raw)) {
    return {
      kind: 'system',
      title: 'Verifikasi sedang mengalami gangguan sementara',
      message:
        'Tenang, data pesananmu tetap aman.\nSilakan refresh halaman lalu coba lagi beberapa saat.',
      showRefresh: true,
      showRetry: true,
    };
  }

  return {
    kind: 'invalid_image',
    title: 'Bukti pembayaran belum dapat terbaca dengan jelas',
    message:
      'Pastikan:\n• nominal terlihat\n• status transfer berhasil\n• gambar tidak blur atau terpotong',
    showRefresh: false,
    showRetry: true,
  };
}

export function getInvalidImagePresentation(): PaymentErrorPresentation {
  return {
    kind: 'invalid_image',
    title: 'Bukti pembayaran belum dapat terbaca dengan jelas',
    message:
      'Pastikan:\n• nominal terlihat\n• status transfer berhasil\n• gambar tidak blur atau terpotong',
    showRefresh: false,
    showRetry: true,
  };
}
