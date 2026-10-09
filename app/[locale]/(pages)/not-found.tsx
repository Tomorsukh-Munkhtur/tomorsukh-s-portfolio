import Link from "next/link";
import { getDictionary, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <section className="container-x flex min-h-[80svh] flex-col justify-center pt-32">
      <p className="eyebrow mb-6">Error 404</p>
      <h1 className="text-[clamp(5rem,22vw,20rem)] leading-[0.85] font-medium tracking-[-0.07em]">
        4<span className="em-serif">0</span>4
      </h1>
      <p className="mt-8 text-2xl font-medium tracking-tight">{dict.notFound.title}</p>
      <p className="mt-2 max-w-md text-muted">{dict.notFound.lead}</p>
      <Link
        href={localePath(locale)}
        className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-fg px-6 py-3 font-medium text-bg"
      >
        ← {dict.notFound.home}
      </Link>
    </section>
  );
}
