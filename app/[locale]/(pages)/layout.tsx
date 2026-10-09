import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { getSettings } from "@/lib/data";
import { displayName } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

/** Regular scrolling pages: header, content and footer. */
export default async function PagesLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const settings = await getSettings();

  return (
    <>
      <SmoothScroll />
      <Header name={displayName(settings, locale)} />
      <main>{children}</main>
      <Footer settings={settings} locale={locale} />
    </>
  );
}
