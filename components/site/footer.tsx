import { cacheLife } from "next/cache";
import Link from "next/link";
import { displayName, getDictionary, localePath, t } from "@/lib/i18n";
import type { Locale, Settings } from "@/lib/types";
import { BackToTop } from "./back-to-top";
import { Clock } from "./clock";
import { FooterCta } from "./footer-cta";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({ settings, locale }: { settings: Settings; locale: Locale }) {
  const dict = getDictionary(locale);
  const year = await currentYear();
  const name = displayName(settings, locale);

  return (
    <footer className="relative overflow-hidden">
      <FooterCta email={settings.email} available={settings.available} />

      <div className="container-x">
        <div className="grid gap-10 border-t border-line py-12 text-sm md:grid-cols-12 md:py-16">
          <div className="md:col-span-5">
            <p className="text-base font-medium">{name}</p>
            <p className="mt-1 text-muted">{t(settings, "role", locale)}</p>
            {t(settings, "location", locale) && (
              <p className="mt-6 text-muted">
                {t(settings, "location", locale)} · <Clock />
              </p>
            )}
          </div>

          <nav className="md:col-span-3" aria-label="Footer">
            <ul className="space-y-2">
              {(["work", "about", "contact"] as const).map((key) => (
                <li key={key}>
                  {/* Sections live as pages on the home canvas. */}
                  <Link href={localePath(locale) + (key === "work" ? "" : `#${key}`)} className="link-underline">
                    {dict.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {settings.socials.length > 0 && (
            <ul className="space-y-2 md:col-span-4 md:text-right">
              {settings.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="link-underline">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 font-mono text-[11px] text-muted uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}. {dict.footer.rights}
          </p>
          <BackToTop label={dict.footer.top} />
        </div>
      </div>

      {/* Oversized name as a closing graphic. */}
      <div aria-hidden className="pointer-events-none container-x -mb-[0.22em] select-none">
        <p className="text-center text-[clamp(4rem,19vw,22rem)] leading-none font-semibold tracking-[-0.07em] text-soft">
          {name}
        </p>
      </div>
    </footer>
  );
}
