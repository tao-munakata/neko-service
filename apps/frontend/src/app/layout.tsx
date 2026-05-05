import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ねこ寄り道 - 地元のご馳走・お福分け',
  description: 'シルバー世代の地元グルメ知識をつなぐコミュニティ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fffdf7]">{children}</body>
    </html>
  );
}
