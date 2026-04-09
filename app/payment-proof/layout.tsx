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

  return {
    title: `Bukti Pembayaran - ${orderNumber}`,
    description: 'Bukti pembayaran pesanan Anda telah dikonfirmasi.',
    openGraph: {
      title: `Bukti Pembayaran - ${orderNumber}`,
      description: 'Bukti pembayaran pesanan Anda telah dikonfirmasi. Pesanan sedang diproses.',
      images: cloudinaryUrl 
        ? [
            {
              url: cloudinaryUrl,
              width: 1200,
              height: 630,
              alt: `Bukti Pembayaran Order ${orderNumber}`,
            },
          ]
        : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Bukti Pembayaran - ${orderNumber}`,
      description: 'Bukti pembayaran pesanan Anda telah dikonfirmasi.',
      images: cloudinaryUrl ? [cloudinaryUrl] : undefined,
    },
  };
}

export default function PaymentProofLayout({ children }: LayoutProps) {
  return children;
}
