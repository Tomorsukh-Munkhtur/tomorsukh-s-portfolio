"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { localePath, t } from "@/lib/i18n";
import type { CardBox, FrameBox } from "@/lib/canvas-layout";
import type { Category, ImageAsset, SocialLink } from "@/lib/types";
import { cn, pad } from "@/lib/utils";
import { Availability } from "../availability";
import { Emphasis } from "../emphasis";
import { Img } from "../img";
import { useLocale } from "../locale-provider";

/*
 * Frames are drawn in world units. Things that should keep a constant size on
 * screen whatever the zoom (frame labels, selection outlines) divide by --z,
 * the current zoom, which the canvas sets on the world element.
 *
 * Every frame and card carries data-layer="<id>" so the layers panel can
 * highlight it (data-highlight) without re-rendering the canvas.
 */

export type Profile = {
  name: string;
  role: string;
  tagline: string;
  available: boolean;
  email: string;
  phone: string;
  location: string;
  socials: SocialLink[];
  skills: string[];
  tools: { name: string; count: number }[];
  about: string[];
  avatar: ImageAsset | null;
  clients: string[];
  projectCount: number;
  categoryCount: number;
};

export const frameLayer = (id: string) => `frame:${id}`;
export const cardLayer = (id: string) => `card:${id}`;

export function FrameShell({
  frame,
  index,
  selected,
  children,
}: {
  frame: FrameBox;
  index: number;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={frame.title}
      data-layer={frameLayer(frame.id)}
      className="group/frame absolute"
      style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
    >
      {/* Figma-style frame label, constant size on screen */}
      <p
        className={cn(
          "absolute bottom-full left-0 flex items-center gap-[0.6em] font-mono whitespace-nowrap text-canvas-muted",
          selected && "text-canvas-ink",
        )}
        style={{ fontSize: "calc(12px / var(--z, 1))", marginBottom: "calc(8px / var(--z, 1))" }}
      >
        <span className="text-canvas-faint">{index + 1}</span>
        <span className="text-canvas-ink">{frame.title}</span>
        {frame.count !== undefined && <span>· {pad(frame.count)}</span>}
      </p>
      <div
        className={cn(
          "absolute inset-0 rounded-[28px] border bg-elev transition-colors",
          selected ? "border-fg" : "border-line group-data-[highlight]/frame:border-fg",
        )}
        style={selected ? { borderWidth: "calc(1.5px / var(--z, 1))" } : undefined}
      />
      <div className="relative h-full">{children}</div>
    </section>
  );
}

function Selection({ w, h, show }: { w: number; h: number; show: boolean }) {
  const corner = "absolute size-[calc(8px/var(--z,1))] border-[length:calc(1.5px/var(--z,1))] border-fg bg-bg";
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-[calc(5px/var(--z,1))] border-[length:calc(1.5px/var(--z,1))] border-fg",
        show ? "block" : "hidden group-hover:block group-data-[highlight]:block",
      )}
    >
      <span className={cn(corner, "-top-[calc(4px/var(--z,1))] -left-[calc(4px/var(--z,1))]")} />
      <span className={cn(corner, "-top-[calc(4px/var(--z,1))] -right-[calc(4px/var(--z,1))]")} />
      <span className={cn(corner, "-bottom-[calc(4px/var(--z,1))] -left-[calc(4px/var(--z,1))]")} />
      <span className={cn(corner, "-right-[calc(4px/var(--z,1))] -bottom-[calc(4px/var(--z,1))]")} />
      <span
        className="absolute top-full left-1/2 -translate-x-1/2 rounded-[3px] bg-fg font-mono whitespace-nowrap text-bg"
        style={{
          fontSize: "calc(11px / var(--z, 1))",
          marginTop: "calc(8px / var(--z, 1))",
          padding: "calc(2px / var(--z, 1)) calc(6px / var(--z, 1))",
        }}
      >
        {w} × {h}
      </span>
    </span>
  );
}

export function CanvasCard({
  card,
  category,
  eager,
  selected,
  onOpen,
}: {
  card: CardBox;
  category?: Category;
  eager?: boolean;
  selected: boolean;
  /** Open the project in the side sheet; modified clicks still follow the link. */
  onOpen?: (slug: string) => void;
}) {
  const { locale, dict } = useLocale();
  const { project } = card;
  const title = t(project, "title", locale);

  return (
    <Link
      href={localePath(locale, `/work/${project.slug}`)}
      draggable={false}
      data-cursor={dict.work.view}
      data-layer={cardLayer(project.id)}
      onClick={(e) => {
        if (!onOpen || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onOpen(project.slug);
      }}
      className="group absolute block"
      style={{ left: card.x, top: card.y, width: card.w }}
    >
      <div className="relative">
        <div className="relative overflow-hidden rounded-[14px] bg-soft" style={{ height: card.imgH }}>
          {project.cover && (
            <Img
              src={project.cover.url}
              alt={title}
              fill
              draggable={false}
              loading={eager ? "eager" : "lazy"}
              sizes="680px"
              className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
            />
          )}
        </div>
        <Selection w={card.w} h={card.imgH} show={selected} />
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <p className="text-[19px] leading-snug font-medium tracking-tight">{title}</p>
        <p className="shrink-0 pt-1 font-mono text-[12px] text-muted uppercase">
          {[category && t(category, "name", locale), project.year].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

const button = "inline-flex items-center rounded-full font-semibold";

export function IntroFrame({
  profile,
  onSeeWork,
  onContact,
}: {
  profile: Profile;
  onSeeWork: () => void;
  onContact: () => void;
}) {
  const { dict } = useLocale();
  return (
    <div className="flex h-full flex-col justify-between p-14">
      <div>
        <div className="origin-top-left scale-[1.35]">
          <Availability
            available={profile.available}
            label={profile.available ? dict.hero.available : dict.hero.unavailable}
          />
        </div>
        <h1 className="mt-14 text-[118px] leading-[0.88] font-semibold tracking-[-0.055em]">{profile.name}</h1>
        <p className="mt-6 flex items-center gap-4 text-[30px] text-muted">
          <span className="h-[2px] w-12 bg-fg" />
          {profile.role}
        </p>
      </div>

      {profile.tagline && (
        <p className="max-w-[640px] text-[40px] leading-[1.12] font-medium tracking-[-0.03em]">
          <Emphasis text={profile.tagline} />
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onSeeWork} className={cn(button, "h-16 gap-3 bg-accent px-8 text-[20px] text-accent-fg")}>
          {dict.canvas.seeWork} →
        </button>
        <button
          type="button"
          onClick={onContact}
          className={cn(button, "h-16 border-2 border-line-strong px-8 text-[20px] font-normal")}
        >
          {dict.hero.talk}
        </button>
      </div>
      <p className="font-mono text-[15px] text-muted">{dict.canvas.hint}</p>
    </div>
  );
}

export function AboutFrame({ profile }: { profile: Profile }) {
  const { dict } = useLocale();
  const [first, ...rest] = profile.about;
  return (
    <div className="grid h-full grid-cols-[440px_1fr] gap-14 p-14">
      <div className="relative overflow-hidden rounded-[20px] bg-soft">
        {profile.avatar ? (
          <Img src={profile.avatar.url} alt={profile.name} fill sizes="880px" draggable={false} className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-serif text-[260px] leading-none text-faint italic">{profile.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="font-mono text-[14px] tracking-wider text-muted uppercase">{dict.canvas.aboutFrame}</p>
        <p className="mt-3 text-[30px] text-muted">{profile.role}</p>
        <div className="mt-8 space-y-5">
          {first && <p className="text-[32px] leading-[1.25] font-medium tracking-[-0.02em]">{first}</p>}
          {rest.map((p, i) => (
            <p key={i} className="text-[22px] leading-[1.5] text-muted">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-3 gap-6 border-t-2 border-line pt-8">
          {[
            { value: profile.projectCount, label: dict.about.projectsDone },
            { value: profile.categoryCount, label: dict.about.categories },
            { value: profile.clients.length, label: dict.canvas.clients },
          ]
            // A zero says nothing, so it's left out until there is something to count.
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.label}>
                <p className="text-[64px] leading-none font-semibold tracking-tighter">{pad(s.value)}</p>
                <p className="mt-2 font-mono text-[13px] text-muted uppercase">{s.label}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function SkillsFrame({ profile }: { profile: Profile }) {
  const { dict } = useLocale();
  return (
    <div className="grid h-full grid-cols-2 gap-10 p-14">
      <div>
        <p className="font-mono text-[14px] tracking-wider text-muted uppercase">{dict.canvas.skillsTitle}</p>
        <ul className="mt-8 space-y-3">
          {profile.skills.map((s, i) => (
            <li key={s} className="flex items-baseline gap-4 text-[28px] leading-tight font-medium tracking-tight">
              <span className="font-mono text-[13px] text-faint">{pad(i + 1)}</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-mono text-[14px] tracking-wider text-muted uppercase">{dict.canvas.toolsTitle}</p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {profile.tools.map((tool) => (
            <li key={tool.name} className="rounded-full border-2 border-line-strong px-5 py-2.5 text-[20px]">
              {tool.name}
              <sup className="ml-1.5 font-mono text-[12px] text-muted">{tool.count}</sup>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ClientsFrame({ profile }: { profile: Profile }) {
  const { dict } = useLocale();
  return (
    <div className="h-full p-14">
      <p className="font-mono text-[14px] tracking-wider text-muted uppercase">{dict.canvas.clients}</p>
      <ul className="mt-8 grid grid-cols-2 gap-x-8">
        {profile.clients.map((client, i) => (
          <li key={client} className="flex items-baseline gap-4 border-b-2 border-line py-4 text-[28px] font-medium tracking-tight">
            <span className="font-mono text-[13px] text-faint">{pad(i + 1)}</span>
            {client}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContactFrame({ profile, onMessage }: { profile: Profile; onMessage: () => void }) {
  const { locale, dict } = useLocale();
  return (
    <div className="flex h-full flex-col justify-between p-14">
      <div>
        <div className="origin-top-left scale-[1.35]">
          <Availability
            available={profile.available}
            label={profile.available ? dict.hero.available : dict.hero.unavailable}
          />
        </div>
        <p className="mt-12 text-[104px] leading-[0.92] font-medium tracking-[-0.05em]">
          <Emphasis text={locale === "mn" ? "Хамтран *ажиллах* уу?" : "Let's work *together*"} />
        </p>
      </div>

      <div className="space-y-7">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          {profile.email && (
            <a href={`mailto:${profile.email}`} draggable={false} className="text-[34px] underline decoration-2 underline-offset-8">
              {profile.email}
            </a>
          )}
          {profile.phone && (
            <a href={`tel:${profile.phone.replace(/\s/g, "")}`} draggable={false} className="text-[24px] text-muted">
              {profile.phone}
            </a>
          )}
          {profile.location && <span className="text-[24px] text-muted">{profile.location}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {profile.socials.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              className="rounded-full border-2 border-line-strong px-5 py-2.5 text-[20px]"
            >
              {s.label} ↗
            </a>
          ))}
          <button
            type="button"
            onClick={onMessage}
            className={cn(button, "ml-auto h-16 gap-3 bg-accent px-8 text-[20px] text-accent-fg")}
          >
            {dict.canvas.message} →
          </button>
        </div>
      </div>
    </div>
  );
}
