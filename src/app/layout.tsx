import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SHAPE_CARDS — Collect. Trade. Battle.',
  description:
    'NFT card collection on Solana. 195 unique shape cards with VHS aesthetic. Buy boosters, open packs, collect rare cards.',
  openGraph: {
    title: 'SHAPE_CARDS',
    description: 'NFT card collection on Solana — 195 unique shape cards',
    siteName: 'SHAPE_CARDS',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
