import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google";
import type { CSSProperties } from "react";
import { Cursor } from "@/components/site/cursor";
import { LocaleProvider } from "@/components/site/locale-provider";
import { SoundEffects } from "@/components/site/sound";
import { ViewTracker } from "@/components/site/view-tracker";
import { accentPalette } from "@/lib/color";
import { SITE_URL } from "@/lib/config";
import { getSettings } from "@/lib/data";
import { displayName, getDictionary, locales, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { SITE_THEMES, themeScript } from "@/lib/theme";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-manrope",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-cormorant",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-geist-mono",
});

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const settings = await getSettings();
  const role = t(settings, "role", locale) || getDictionary(locale).meta.portfolio;
  const name = displayName(settings, locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} — ${role}`,
      template: `%s — ${name}`,
    },
    description: t(settings, "intro", locale),
    alternates: {
      canonical: `/${locale}`,
      languages: { mn: "/mn", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: name,
      locale: locale === "mn" ? "mn_MN" : "en_US",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
  ],
};

export default async function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const settings = await getSettings();
  const accent = accentPalette(settings.accent);

  return (
    <html
      lang={locale}
      data-site=""
      data-theme="dark"
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${geistMono.variable}`}
      style={accent ? ({ "--accent": accent.accent, "--accent-fg": accent.onAccent } as CSSProperties) : undefined}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(SITE_THEMES, true) }} />
      </head>
      <body className="min-h-svh">
        <LocaleProvider locale={locale} dict={getDictionary(locale)}>
          {children}
          <SoundEffects />
          <Cursor />
          <ViewTracker />
        </LocaleProvider>
      </body>
    </html>
  );
}
