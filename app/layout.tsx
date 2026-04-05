import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pesan Makanan - Jukut Online",
  description: "Aplikasi pemesanan makanan Jukut Online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="animated-gradient">
        {children}
      </body>
    </html>
  );
}
