import { Metadata } from 'next';
import { Manrope, Unbounded } from 'next/font/google';
import './globals.css';

// Mongolian letters (Ө, Ү) live in the cyrillic-ext subset.
const display = Unbounded({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-display',
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tomorsukh - UI/UX Design Portfolio',
  description: 'Light, intuitive digital experiences through clean UI/UX design',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '42x42' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
};

export const viewport = {
  themeColor: '#07061a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
