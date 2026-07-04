import type { Metadata, Viewport } from 'next';
import { Manrope, Sora } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const sora = Sora({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Grupo Elshaday',
  description:
    'Plataforma de discipulado, comunhão e crescimento espiritual — constância, comunhão e serviço.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#08080a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${sora.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
