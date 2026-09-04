import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({ variable: '--font-plex-sans', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://lane-studio.katharinabrenner.com'),
  title: 'Lane Studio',
  description: 'Mark, position, format, export.',
  openGraph: {
    title: 'Lane Studio',
    description: 'Mark, position, format, export.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Lane Studio gel annotation workspace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lane Studio',
    description: 'Mark, position, format, export.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable}`}>{children}</body>
    </html>
  );
}
