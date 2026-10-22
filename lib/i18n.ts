import type { Locale } from "./types";

export const locales = ["mn", "en"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "mn";
export const LOCALE_COOKIE = "locale";

export const hasLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

const mn = {
  meta: {
    portfolio: "Дизайн портфолио",
  },
  nav: {
    home: "Нүүр",
    work: "Бүтээл",
    about: "Миний тухай",
    contact: "Холбоо барих",
    menu: "Цэс",
    close: "Хаах",
  },
  hero: {
    available: "Ажлын саналд нээлттэй",
    unavailable: "Одоогоор ажилтай",
    scroll: "Доош гүйлгэх",
    basedIn: "Байршил",
    localTime: "Орон нутгийн цаг",
    viewWork: "Бүтээл үзэх",
    talk: "Холбогдох",
  },
  work: {
    eyebrow: "Сонгомол бүтээлүүд",
    title: "Бүтээлүүд",
    lead: "Брэнд, дижитал бүтээгдэхүүн, хэвлэмэл дизайны сонгомол төслүүд.",
    all: "Бүгд",
    view: "Үзэх",
    viewAll: "Бүх бүтээлийг үзэх",
    empty: "Энэ ангилалд одоогоор бүтээл алга.",
    projects: "төсөл",
  },
  project: {
    client: "Үйлчлүүлэгч",
    year: "Он",
    role: "Үүрэг",
    category: "Ангилал",
    tools: "Хэрэгсэл",
    visit: "Төслийг үзэх",
    overview: "Тойм",
    gallery: "Зургийн цомог",
    next: "Дараагийн төсөл",
    back: "Бүх бүтээл",
  },
  about: {
    eyebrow: "Миний тухай",
    title: "Тухай",
    services: "Ур чадвар",
    clients: "Хамтран ажилласан",
    cta: "Илүү ихийг унших",
    projectsDone: "Хийсэн төсөл",
    categories: "Чиглэл",
  },
  contact: {
    eyebrow: "Холбоо барих",
    title: "Хамтдаа гоё зүйл бүтээе",
    cta: "Хамтран ажиллах уу?",
    lead: "Шинэ төсөл, санаа, эсвэл зүгээр л мэндчилгээ — мессеж үлдээгээрэй. Ихэвчлэн 1–2 хоногт хариулдаг.",
    name: "Таны нэр",
    email: "И-мэйл хаяг",
    subject: "Сэдэв",
    message: "Мессеж",
    messagePlaceholder: "Төслийнхөө талаар товч бичнэ үү…",
    send: "Мессеж илгээх",
    sending: "Илгээж байна…",
    sent: "Баярлалаа! Таны мессеж амжилттай хүрлээ.",
    error: "Алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.",
    invalid: "Нэр, зөв и-мэйл хаяг, мессежээ бөглөнө үү.",
    direct: "Шууд холбогдох",
    socials: "Сошиал",
  },
  footer: {
    rights: "Бүх эрх хуулиар хамгаалагдсан.",
    top: "Дээш буцах",
  },
  theme: {
    toggle: "Өнгөний горим солих",
  },
  notFound: {
    title: "Хуудас олдсонгүй",
    lead: "Таны хайсан хуудас устсан эсвэл хэзээ ч байгаагүй байж магадгүй.",
    home: "Нүүр хуудас руу буцах",
  },
};

export type Dictionary = typeof mn;

const en: Dictionary = {
  meta: {
    portfolio: "Design portfolio",
  },
  nav: {
    home: "Home",
    work: "Work",
    about: "About me",
    contact: "Contact",
    menu: "Menu",
    close: "Close",
  },
  hero: {
    available: "Open to new opportunities",
    unavailable: "Currently employed",
    scroll: "Scroll",
    basedIn: "Based in",
    localTime: "Local time",
    viewWork: "View work",
    talk: "Get in touch",
  },
  work: {
    eyebrow: "Selected work",
    title: "Work",
    lead: "A selection of brand, digital product and print projects.",
    all: "All",
    view: "View",
    viewAll: "View all work",
    empty: "No projects in this category yet.",
    projects: "projects",
  },
  project: {
    client: "Client",
    year: "Year",
    role: "Role",
    category: "Category",
    tools: "Tools",
    visit: "Visit project",
    overview: "Overview",
    gallery: "Gallery",
    next: "Next project",
    back: "All work",
  },
  about: {
    eyebrow: "About me",
    title: "About",
    services: "Skills",
    clients: "Worked with",
    cta: "More about me",
    projectsDone: "Projects",
    categories: "Disciplines",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's make something great",
    cta: "Let's work together",
    lead: "A new project, an idea, or just saying hi — drop a message. I usually reply within 1–2 days.",
    name: "Your name",
    email: "Email address",
    subject: "Subject",
    message: "Message",
    messagePlaceholder: "Tell me a little about your project…",
    send: "Send message",
    sending: "Sending…",
    sent: "Thank you! Your message has been delivered.",
    error: "Something went wrong. Please try again shortly.",
    invalid: "Please fill in your name, a valid email and a message.",
    direct: "Reach out directly",
    socials: "Social",
  },
  footer: {
    rights: "All rights reserved.",
    top: "Back to top",
  },
  theme: {
    toggle: "Toggle color theme",
  },
  notFound: {
    title: "Page not found",
    lead: "The page you're looking for was moved, removed, or never existed.",
    home: "Back to home",
  },
};

const dictionaries: Record<Locale, Dictionary> = { mn, en };

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

type Localized<K extends string> = { [P in `${K}_mn` | `${K}_en`]: string };

/** Read a bilingual field (`title_mn` / `title_en`), falling back to the other language when empty. */
export function t<K extends string>(obj: Localized<K>, key: K, locale: Locale): string {
  const primary = obj[`${key}_${locale}` as keyof Localized<K>];
  if (primary?.trim()) return primary;
  const other = obj[`${key}_${locale === "mn" ? "en" : "mn"}` as keyof Localized<K>];
  return other ?? "";
}

/** The person's name for the current language: Cyrillic on the Mongolian site, Latin otherwise. */
export const displayName = (s: { name: string; name_mn: string }, locale: Locale) =>
  (locale === "mn" && s.name_mn.trim()) || s.name;

/** Prefix a site path with the locale: localePath("en", "/work") → "/en/work". */
export const localePath = (locale: Locale, path = "/") =>
  `/${locale}${path === "/" ? "" : path}`;
