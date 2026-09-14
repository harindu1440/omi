import type { Metadata } from 'next';
import { Noto_Sans_Sinhala, Noto_Serif_Sinhala, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansSinhala = Noto_Sans_Sinhala({ 
  subsets: ['sinhala'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-sinhala-sans' 
});
const notoSerifSinhala = Noto_Serif_Sinhala({ 
  subsets: ['sinhala'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-sinhala-serif' 
});

export const metadata: Metadata = {
  title: 'ඕමී — Premium Sri Lankan Card Game',
  description: 'Play Omi online. A modern, premium Sri Lankan trick-taking card game.',
  keywords: ['omi', 'sri lanka', 'card game', 'trick taking', 'multiplayer'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="si" className={`${inter.variable} ${notoSansSinhala.variable} ${notoSerifSinhala.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#08130F" />
      </head>
      <body>{children}</body>
    </html>
  );
}
