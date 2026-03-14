import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const noto = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ライブ記録アプリ",
  description: "行ったライブを記録して、ランキングで自慢できる",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={noto.variable}>
      <body className="min-h-screen antialiased font-sans text-gray-900 bg-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
