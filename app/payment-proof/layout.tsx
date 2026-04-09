import type { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  searchParams,
}: LayoutProps): Promise<Metadata> {
  const cloudinaryUrl = 
    typeof searchParams?.url === 'string' ? searchParams.url : '';
  const orderNumber = 
    typeof searchParams?.order === 'string' ? searchParams.order : 'Ordermu';

  // Gunakan URL Cloudinary langsung sebagai thumbnail (tidak perlu query params jika sudah optimal)
  const thumbnailUrl = cloudinaryUrl || '';

  return {
    title: `Bukti Pembayaran - ${orderNumber}`,
    description: `Bukti pembayaran ORDER ${orderNumber}. Pesanan sedang diproses.`,
    openGraph: {
      title: `Bukti Pembayaran Jukut Online - ${orderNumber}`,
      description: `ORDER ${orderNumber} - Bukti pembayaran telah diterima dan sedang diverifikasi.`,
      url: `https://order-jukut-online-git-main-arzies-projects.vercel.app/payment-proof?url=${encodeURIComponent(cloudinaryUrl)}&order=${orderNumber}`,
      siteName: 'Jukut Online',
      type: 'website',
      images: thumbnailUrl
        ? [
            {
              url: thumbnailUrl,
              width: 1080,
              height: 1080,
              alt: `Bukti Pembayaran Order ${orderNumber}`,
              type: 'image/jpeg',
              secureUrl: thumbnailUrl,
            },
          ]
        : undefined,
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bukti Pembayaran - ${orderNumber}`,
      description: `ORDER ${orderNumber} - Bukti pembayaran Jukut Online`,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
    },
  };
}

export default function PaymentProofLayout({ children }: LayoutProps) {
  return children;
}
