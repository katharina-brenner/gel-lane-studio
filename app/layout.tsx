import type { Metadata } from 'next';
import { DM_Mono, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const dmMono = DM_Mono({ variable: '--font-dm-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://lane-studio-kjb.katharina-brenner1.chatgpt.site'),
  title: 'Lane Studio — Gel annotation tool',
  description: 'Arrange, label, style, and export lanes on gel and blot images.',
  openGraph: {
    title: 'Lane Studio — Gel annotation tool',
    description: 'Arrange, label, style, and export lanes on gel and blot images.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Lane Studio gel annotation workspace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lane Studio — Gel annotation tool',
    description: 'Arrange, label, style, and export lanes on gel and blot images.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${dmMono.variable}`}>{children}</body>
    </html>
  );
}
