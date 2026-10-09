"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { localePath } from "@/lib/i18n";
import { Availability } from "./availability";
import { Emphasis } from "./emphasis";
import { useLocale } from "./locale-provider";
import { Reveal } from "./reveal";

type CtaProps = { email: string; available: boolean };

function Cta({ email, available }: CtaProps) {
  const { locale, dict } = useLocale();
  return (
    <section className="container-x pt-28 pb-20 md:pt-44 md:pb-28">
      <Reveal className="mb-8 flex flex-wrap items-center gap-4">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-10 bg-line-strong" /> {dict.contact.eyebrow}
        </p>
        <Availability available={available} label={available ? dict.hero.available : dict.hero.unavailable} />
      </Reveal>
      <Reveal delay={0.05}>
        <Link
          href={`${localePath(locale)}#contact`}
          data-cursor="→"
          className="group block text-[clamp(3rem,10.5vw,11.5rem)] leading-[0.92] font-medium tracking-[-0.055em]"
        >
          <Emphasis text={locale === "mn" ? "Хамтран *ажиллах* уу?" : "Let's work *together*"} />
          <span className="ml-[0.15em] inline-block text-accent-ink transition-transform duration-700 ease-out-expo group-hover:translate-x-4 group-hover:-rotate-45">
            ↗
          </span>
        </Link>
      </Reveal>
      {email && (
        <Reveal delay={0.1} className="mt-10 md:mt-14">
          <a
            href={`mailto:${email}`}
            className="link-underline text-xl text-muted transition-colors hover:text-fg md:text-3xl"
          >
            {email}
          </a>
        </Reveal>
      )}
    </section>
  );
}

function PathAwareCta(props: CtaProps) {
  const pathname = usePathname();
  if (/^\/(mn|en)\/contact/.test(pathname)) return null;
  return <Cta {...props} />;
}

/** Large "let's work together" call to action, hidden on the contact page itself. */
export function FooterCta(props: CtaProps) {
  return (
    <Suspense fallback={<Cta {...props} />}>
      <PathAwareCta {...props} />
    </Suspense>
  );
}
