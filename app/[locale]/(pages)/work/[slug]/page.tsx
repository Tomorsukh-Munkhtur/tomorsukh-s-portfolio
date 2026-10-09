import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Img } from "@/components/site/img";
import { ParallaxImage } from "@/components/site/parallax-image";
import { Reveal } from "@/components/site/reveal";
import { SplitHeadline } from "@/components/site/split-headline";
import { getCategories, getProject, getProjects } from "@/lib/data";
import { getDictionary, localePath, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { cn, pad, paragraphs } from "@/lib/utils";

export async function generateStaticParams() {
  const projects = await getProjects();
  // Cache Components needs at least one sample param to validate the route.
  return projects.length > 0
    ? projects.map((p) => ({ slug: p.slug }))
    : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const result = await getProject(slug);
  if (!result) return {};
  const { project } = result;
  return {
    title: t(project, "title", locale),
    description: t(project, "summary", locale),
    openGraph: project.cover ? { images: [{ url: project.cover.url }] } : undefined,
  };
}

export default function ProjectPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      {params.then(({ slug }) => (
        <ProjectContent slug={slug} />
      ))}
    </Suspense>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container-x animate-pulse pt-32 md:pt-44" aria-hidden>
      <div className="mb-16 h-4 w-28 rounded-full bg-soft" />
      <div className="h-[clamp(2.75rem,8.5vw,9.5rem)] w-3/4 rounded-2xl bg-soft" />
      <div className="mt-24 aspect-[16/9] rounded-[clamp(16px,2vw,32px)] bg-soft" />
    </div>
  );
}

async function ProjectContent({ slug }: { slug: string }) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [result, categories, projects] = await Promise.all([
    getProject(slug),
    getCategories(),
    getProjects(),
  ]);
  if (!result) notFound();

  const { project, next } = result;
  const title = t(project, "title", locale);
  const category = categories.find((c) => c.id === project.category_id);
  const body = paragraphs(t(project, "description", locale));
  const index = projects.findIndex((p) => p.id === project.id);

  const meta = [
    { label: dict.project.client, value: project.client },
    { label: dict.project.year, value: project.year ? String(project.year) : "" },
    { label: dict.project.role, value: t(project, "role", locale) },
    { label: dict.project.category, value: category ? t(category, "name", locale) : "" },
    { label: dict.project.tools, value: project.tools.join(", ") },
  ].filter((m) => m.value);

  return (
    <article>
      <header className="container-x pt-32 md:pt-44">
        <Reveal className="mb-10 flex items-center justify-between md:mb-16">
          <Link
            href={localePath(locale)}
            className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
          >
            <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">←</span>
            {dict.project.back}
          </Link>
          <span className="font-mono text-xs text-muted">
            {pad(index + 1)} / {pad(projects.length)}
          </span>
        </Reveal>

        <SplitHeadline
          text={title}
          className="max-w-[16ch] text-[clamp(2.75rem,8.5vw,9.5rem)] leading-[0.92] font-medium tracking-[-0.055em]"
        />
        {t(project, "summary", locale) && (
          <Reveal delay={0.35} className="mt-8 md:mt-12">
            <p className="max-w-2xl text-lg leading-relaxed text-muted md:text-2xl">
              {t(project, "summary", locale)}
            </p>
          </Reveal>
        )}
      </header>

      {project.cover && (
        <Reveal delay={0.2} y={60} className="container-x mt-14 md:mt-24">
          <ParallaxImage
            image={project.cover}
            alt={title}
            priority
            className="aspect-[4/3] rounded-[clamp(16px,2vw,32px)] md:aspect-[16/9]"
          />
        </Reveal>
      )}

      <section className="container-x grid gap-14 py-20 md:grid-cols-12 md:py-32">
        <Reveal className="md:col-span-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-1">
            {meta.map((m) => (
              <div key={m.label} className="border-t border-line pt-4">
                <dt className="eyebrow">{m.label}</dt>
                <dd className="mt-2 text-base">{m.value}</dd>
              </div>
            ))}
          </dl>
          {project.external_url && (
            <a
              href={project.external_url}
              target="_blank"
              rel="noreferrer"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg"
            >
              {dict.project.visit}
              <span className="transition-transform duration-500 ease-out-expo group-hover:-rotate-45">→</span>
            </a>
          )}
        </Reveal>

        {body.length > 0 && (
          <Reveal delay={0.1} className="md:col-span-7 md:col-start-6">
            <p className="eyebrow mb-8">{dict.project.overview}</p>
            <div className="space-y-6">
              {body.map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    "leading-relaxed",
                    i === 0
                      ? "text-2xl leading-snug font-medium tracking-[-0.02em] md:text-3xl"
                      : "text-lg text-muted md:text-xl",
                  )}
                >
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
        )}
      </section>

      {project.gallery.length > 0 && (
        <section className="container-x" aria-label={dict.project.gallery}>
          <ul className="grid gap-4 md:grid-cols-2 md:gap-6">
            {project.gallery.map((image, i) => (
              <li key={`${image.url}-${i}`} className={cn(image.wide && "md:col-span-2")}>
                <Reveal y={50}>
                  <div className="overflow-hidden rounded-[clamp(12px,1.6vw,24px)] bg-soft">
                    <Img
                      src={image.url}
                      alt={`${title} — ${i + 1}`}
                      width={image.width ?? 1600}
                      height={image.height ?? 1200}
                      sizes={image.wide ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
                      className="h-auto w-full"
                    />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      {next && (
        <section className="container-x pt-28 md:pt-44">
          <Link
            href={localePath(locale, `/work/${next.slug}`)}
            data-cursor={dict.work.view}
            className="group grid items-end gap-8 border-t border-line pt-8 md:grid-cols-12"
          >
            <div className="md:col-span-8">
              <p className="eyebrow mb-6">{dict.project.next} →</p>
              <p className="text-[clamp(2.5rem,7vw,7.5rem)] leading-[0.95] font-medium tracking-[-0.05em] transition-colors duration-500 group-hover:text-accent-ink">
                {t(next, "title", locale)}
              </p>
            </div>
            {next.cover && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-soft md:col-span-4">
                <Img
                  src={next.cover.url}
                  alt={t(next, "title", locale)}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-105"
                />
              </div>
            )}
          </Link>
        </section>
      )}
    </article>
  );
}
