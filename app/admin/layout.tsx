import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { ADMIN_THEMES, themeScript } from "@/lib/theme";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-manrope",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-geist-mono",
});


// The admin always renders per request; let it block instead of streaming a shell.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Админ", template: "%s — Админ" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html
      lang="mn"
      data-theme="dark"
      suppressHydrationWarning
      className={`${manrope.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(ADMIN_THEMES) }} />
      </head>
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
