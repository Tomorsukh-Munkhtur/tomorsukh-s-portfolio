"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LOCALE_COOKIE, locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "./locale-provider";

const remember = (locale: string) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
};

function Links({ hrefFor }: { hrefFor: (locale: string) => string }) {
  const { locale: current } = useLocale();
  return (
    <div className="flex items-center rounded-full border border-line p-0.5 font-mono text-[11px] uppercase">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={hrefFor(locale)}
          onClick={() => remember(locale)}
          aria-current={locale === current ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1.5 leading-none transition-colors",
            locale === current ? "bg-fg text-bg" : "text-muted hover:text-fg",
          )}
        >
          {locale}
        </Link>
      ))}
    </div>
  );
}

function PathAwareLinks() {
  const pathname = usePathname();
  return (
    <Links hrefFor={(locale) => pathname.replace(/^\/(mn|en)(?=\/|$)/, `/${locale}`) || `/${locale}`} />
  );
}

/** MN / EN switch that keeps the visitor on the same page. */
export function LocaleSwitch() {
  return (
    <Suspense fallback={<Links hrefFor={(locale) => `/${locale}`} />}>
      <PathAwareLinks />
    </Suspense>
  );
}
