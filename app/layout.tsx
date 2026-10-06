import { Metadata } from 'next';
import { Onest } from 'next/font/google';
import './globals.css';

// One clean family for headings and text. Mongolian Ө and Ү live in the
// cyrillic-ext subset, which Onest fully covers.
const sans = Onest({
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
    <html lang="mn" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
