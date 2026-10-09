import type { Project } from "./types";

/*
 * World layout for the home canvas. Like a Figma file, the canvas has pages
 * (work, about, contact); each page holds frames packed left to right into
 * rows. Inside a category frame, project cards form a masonry of up to three
 * columns. All sizes are in world units (1 = 1px at 100% zoom).
 */

export const PAGE_IDS = ["work", "about", "contact"] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const CARD_W = 340;
const CARD_GAP = 28;
const FRAME_PAD = 36;
const CAPTION_H = 60;
const FRAME_GAP_X = 140;
const FRAME_GAP_Y = 200;
const MAX_ROW_W = 3600;

export type CardBox = {
  project: Project;
  /** Relative to the frame. */
  x: number;
  y: number;
  w: number;
  imgH: number;
};

export type FrameKind = "intro" | "category" | "about" | "skills" | "clients" | "contact";

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
};

type Unplaced = Omit<FrameBox, "x" | "y">;

function imageHeight(p: Project) {
  const ratio = p.cover?.width && p.cover?.height ? p.cover.height / p.cover.width : 0.75;
  return Math.round(CARD_W * Math.min(1.3, Math.max(0.62, ratio)));
}

function categoryFrame(id: string, title: string, projects: Project[]): Unplaced {
  const n = projects.length;
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const heights = Array<number>(cols).fill(0);
  const cards = projects.map((project) => {
    const col = heights.indexOf(Math.min(...heights));
    const imgH = imageHeight(project);
    const card = {
      project,
      x: FRAME_PAD + col * (CARD_W + CARD_GAP),
      y: FRAME_PAD + heights[col],
      w: CARD_W,
      imgH,
    };
    heights[col] += imgH + CAPTION_H + CARD_GAP;
    return card;
  });
  return {
    id,
    kind: "category",
    title,
    count: n,
    w: FRAME_PAD * 2 + cols * CARD_W + (cols - 1) * CARD_GAP,
    h: FRAME_PAD * 2 + Math.max(...heights) - CARD_GAP,
    cards,
  };
}

/** Shelf packing into rows. */
function pack(frames: Unplaced[]): FrameBox[] {
  const placed: FrameBox[] = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const f of frames) {
    if (x > 0 && x + f.w > MAX_ROW_W) {
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

/** Rough height of the bio text at the sizes used in the about frame. */
function aboutHeight(paragraphs: string[]) {
  const [first = "", ...rest] = paragraphs;
  const lines = Math.ceil(first.length / 36) * 40 + rest.reduce((h, p) => h + Math.ceil(p.length / 54) * 33 + 22, 0);
  return Math.max(720, 120 + lines + 300);
}

export function buildCanvas({
  projects,
  categories,
  about,
  skillCount,
  toolCount,
  clientCount,
  labels,
}: {
  projects: Project[];
  categories: { id: string; slug: string; title: string }[];
  about: string[];
  skillCount: number;
  toolCount: number;
  clientCount: number;
  labels: { intro: string; other: string; about: string; skills: string; clients: string; contact: string };
}): Record<PageId, FrameBox[]> {
  // Work: introduction, then one frame per category.
  const work: Unplaced[] = [{ id: "intro", kind: "intro", title: labels.intro, w: 780, h: 620, cards: [] }];
  for (const c of categories) {
    const list = projects.filter((p) => p.category_id === c.id);
    if (list.length) work.push(categoryFrame(c.slug, c.title, list));
  }
  const known = new Set(categories.map((c) => c.id));
  const others = projects.filter((p) => !p.category_id || !known.has(p.category_id));
  if (others.length) work.push(categoryFrame("other", labels.other, others));

  // About: bio with portrait, skills & tools, clients.
  const aboutFrames: Unplaced[] = [{ id: "about", kind: "about", title: labels.about, w: 1220, h: aboutHeight(about), cards: [] }];
  if (skillCount || toolCount) {
    const rows = Math.max(skillCount, Math.ceil(toolCount / 2), 4);
    aboutFrames.push({ id: "skills", kind: "skills", title: labels.skills, w: 780, h: 190 + rows * 50, cards: [] });
  }
  if (clientCount) {
    aboutFrames.push({
      id: "clients",
      kind: "clients",
      title: labels.clients,
      w: 780,
      h: 200 + Math.ceil(clientCount / 2) * 64,
      cards: [],
    });
  }

  // Contact: a single frame.
  const contact: Unplaced[] = [{ id: "contact", kind: "contact", title: labels.contact, w: 920, h: 640, cards: [] }];

  return { work: pack(work), about: pack(aboutFrames), contact: pack(contact) };
}

export function worldBounds(frames: FrameBox[]) {
  const minX = Math.min(...frames.map((f) => f.x));
  const minY = Math.min(...frames.map((f) => f.y));
  const maxX = Math.max(...frames.map((f) => f.x + f.w));
  const maxY = Math.max(...frames.map((f) => f.y + f.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
