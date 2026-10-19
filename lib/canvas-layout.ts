import type { ImageAsset, Project } from "./types";

/*
 * World layout for the home canvas. Like a Figma file, the canvas has pages:
 * "About me", a featured-work overview, one page per project (grouped by
 * category in the pages list) and contact. Each page holds frames packed left
 * to right into rows. All sizes are in world units (1 = 1px at 100% zoom).
 */

/** Page ids double as URL hashes: "" (about), "#work", "#work/<slug>", "#contact". */
export type PageId = string;
export const HOME_PAGE = "about";
export const WORK_PAGE = "work";
/** The fixed pages, in the order the site lists them. */
export const MAIN_PAGES = ["about", "work", "contact"] as const;
export const projectPage = (slug: string) => `${WORK_PAGE}/${slug}`;
export const pageHash = (page: PageId) => (page === HOME_PAGE ? "" : `#${page}`);

/** A project that no longer exists falls back to the work overview, anything else to home. */
export function pageFromHash(hash: string, exists: (id: PageId) => boolean): PageId {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {}
  if (exists(id)) return id;
  return id.startsWith(`${WORK_PAGE}/`) && exists(WORK_PAGE) ? WORK_PAGE : HOME_PAGE;
}

const FEATURED_CARD_W = 560;
const CARD_GAP = 28;
const FRAME_PAD = 36;
const FRAME_GAP_X = 140;
const FRAME_GAP_Y = 200;
const MAX_ROW_W = 3600;
/** Wider rows on project pages, so two wide artboards sit side by side. */
const PROJECT_ROW_W = 4800;
/** Artboards come in two widths, so a project page reads as a tidy grid. */
const ARTBOARD_W = 1080;
const WIDE_ARTBOARD_W = ARTBOARD_W * 2 + FRAME_GAP_X;

export type CardBox = {
  project: Project;
  /** Relative to the frame. */
  x: number;
  y: number;
  w: number;
  imgH: number;
};

export type FrameKind = "cards" | "artboard" | "about" | "skills" | "clients" | "contact";

export type FrameBox = {
  id: string;
  kind: FrameKind;
  title: string;
  count?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cards: CardBox[];
  /** The picture an artboard shows. */
  image?: ImageAsset;
};

export type CanvasPage = {
  id: PageId;
  /** Project pages: the category id (or "other") the pages list groups them by. */
  group?: string;
  project?: Project;
  frames: FrameBox[];
};

export type CanvasGroup = { id: string; title: string };
export type CanvasFile = { pages: CanvasPage[]; groups: CanvasGroup[] };

type Unplaced = Omit<FrameBox, "x" | "y">;

const ratioOf = (image?: ImageAsset | null) => (image?.width && image?.height ? image.height / image.width : 0.75);

/** Project cards in a masonry of up to `maxCols` columns. */
function cardsFrame(id: string, title: string, projects: Project[], cardW: number, maxCols: number): Unplaced {
  const n = projects.length;
  const cols = Math.min(maxCols, n <= 2 ? n : n <= 4 ? 2 : 3);
  const captionH = cardW > 400 ? 84 : 60;
  const heights = Array<number>(cols).fill(0);
  const cards = projects.map((project) => {
    const col = heights.indexOf(Math.min(...heights));
    const imgH = Math.round(cardW * Math.min(1.3, Math.max(0.62, ratioOf(project.cover))));
    const card = { project, x: FRAME_PAD + col * (cardW + CARD_GAP), y: FRAME_PAD + heights[col], w: cardW, imgH };
    heights[col] += imgH + captionH + CARD_GAP;
    return card;
  });
  return {
    id,
    kind: "cards",
    title,
    count: n,
    w: FRAME_PAD * 2 + cols * cardW + (cols - 1) * CARD_GAP,
    h: FRAME_PAD * 2 + Math.max(...heights) - CARD_GAP,
    cards,
  };
}

/** One artboard per picture: the cover first and wide, then the gallery. */
function projectFrames(project: Project, coverLabel: string): Unplaced[] {
  const pictures = [
    ...(project.cover ? [{ image: project.cover, wide: true }] : []),
    // Landscape shots and ones marked "full width" in the admin span two columns.
    ...project.gallery.map((image) => ({ image, wide: Boolean(image.wide) || ratioOf(image) < 0.62 })),
  ];
  // Never an empty page, even for a project without pictures yet.
  if (!pictures.length) return [{ id: "empty", kind: "artboard", title: coverLabel, w: ARTBOARD_W, h: 720, cards: [] }];
  return pictures.map(({ image, wide }, i) => {
    const w = wide ? WIDE_ARTBOARD_W : ARTBOARD_W;
    return {
      id: `art-${i + 1}`,
      kind: "artboard",
      title: i === 0 && project.cover ? coverLabel : String(i + 1).padStart(2, "0"),
      w,
      h: Math.round(w * Math.min(3, ratioOf(image))),
      cards: [],
      image,
    };
  });
}

/** Shelf packing into rows. */
function pack(frames: Unplaced[], maxRowW = MAX_ROW_W): FrameBox[] {
  const placed: FrameBox[] = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const f of frames) {
    if (x > 0 && x + f.w > maxRowW) {
      x = 0;
      y += rowH + FRAME_GAP_Y;
      rowH = 0;
    }
    placed.push({ ...f, x, y });
    x += f.w + FRAME_GAP_X;
    rowH = Math.max(rowH, f.h);
  }
  return placed;
}

/** The about frame's portrait column: the photo shows whole, at its own shape. */
export const PORTRAIT_W = 440;
const ABOUT_PAD = 56;

/** Tall enough for the bio text (roughly, at the sizes used) and the whole portrait. */
function aboutHeight(paragraphs: string[], avatar?: ImageAsset | null) {
  if (!avatar) return textHeight(paragraphs);
  const ratio = avatar.width && avatar.height ? avatar.height / avatar.width : 5 / 4;
  return Math.max(ABOUT_PAD * 2 + Math.round(PORTRAIT_W * ratio), textHeight(paragraphs));
}

function textHeight(paragraphs: string[]) {
  const [first = "", ...rest] = paragraphs;
  const lines = Math.ceil(first.length / 36) * 40 + rest.reduce((h, p) => h + Math.ceil(p.length / 54) * 33 + 22, 0);
  // + the name heading and the "see my work" button row
  return Math.max(880, 120 + lines + 490);
}

export function buildCanvas({
  projects,
  categories,
  about,
  avatar,
  skillCount,
  toolCount,
  clientCount,
  labels,
}: {
  projects: Project[];
  categories: { id: string; title: string }[];
  about: string[];
  avatar?: ImageAsset | null;
  skillCount: number;
  toolCount: number;
  clientCount: number;
  labels: { featured: string; cover: string; other: string; about: string; skills: string; clients: string; contact: string };
}): CanvasFile {
  // About: bio with portrait, skills & tools, clients.
  const aboutFrames: Unplaced[] = [{ id: "about", kind: "about", title: labels.about, w: 1220, h: aboutHeight(about, avatar), cards: [] }];
  if (skillCount || toolCount) {
    const rows = Math.max(skillCount, Math.ceil(toolCount / 2), 4);
    aboutFrames.push({ id: "skills", kind: "skills", title: labels.skills, w: 780, h: 190 + rows * 50, cards: [] });
  }
  if (clientCount) {
    const h = 200 + Math.ceil(clientCount / 2) * 64;
    aboutFrames.push({ id: "clients", kind: "clients", title: labels.clients, w: 780, h, cards: [] });
  }

  // Work overview: the starred projects, or the first few when none are starred.
  const starred = projects.filter((p) => p.featured);
  const featured = starred.length ? starred : projects.slice(0, 6);
  const work: Unplaced[] = featured.length ? [cardsFrame("featured", labels.featured, featured, FEATURED_CARD_W, 2)] : [];

  // One page per project, grouped by category in category order.
  const known = new Set(categories.map((c) => c.id));
  const groups: CanvasGroup[] = [...categories, { id: "other", title: labels.other }].filter((g) =>
    projects.some((p) => (p.category_id && known.has(p.category_id) ? p.category_id : "other") === g.id),
  );
  const projectPages: CanvasPage[] = groups.flatMap((g) =>
    projects
      .filter((p) => (p.category_id && known.has(p.category_id) ? p.category_id : "other") === g.id)
      .map((p) => ({ id: projectPage(p.slug), group: g.id, project: p, frames: pack(projectFrames(p, labels.cover), PROJECT_ROW_W) })),
  );

  const contact: Unplaced[] = [{ id: "contact", kind: "contact", title: labels.contact, w: 920, h: 640, cards: [] }];

  return {
    pages: [
      { id: HOME_PAGE, frames: pack(aboutFrames) },
      { id: WORK_PAGE, frames: pack(work) },
      ...projectPages,
      { id: "contact", frames: pack(contact) },
    ],
    groups,
  };
}

export function worldBounds(frames: FrameBox[]) {
  if (!frames.length) return { x: 0, y: 0, w: 1, h: 1 };
  const minX = Math.min(...frames.map((f) => f.x));
  const minY = Math.min(...frames.map((f) => f.y));
  const maxX = Math.max(...frames.map((f) => f.x + f.w));
  const maxY = Math.max(...frames.map((f) => f.y + f.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
