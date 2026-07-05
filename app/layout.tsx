import { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
