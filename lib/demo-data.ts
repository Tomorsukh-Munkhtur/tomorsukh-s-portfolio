import type { Category, ImageAsset, Project, Settings } from "./types";

/** Sample content shown until Supabase is connected. */

const img = (name: string, width: number, height: number, wide = false): ImageAsset => ({
  url: `/demo/${name}.svg`,
  width,
  height,
  wide,
});

export const demoSettings: Settings = {
  name: "Tumursukh",
  name_mn: "Төмөрсүх",
  name_script: "ᠲᠡᠮᠦᠷᠰᠦᠬᠡ",
  role_mn: "Брэнд ба дижитал дизайнер",
  role_en: "Brand & digital designer",
  tagline_mn: "Хүмүүсийн сэтгэлд *үлдэх* брэнд, дижитал туршлагыг бүтээдэг.",
  tagline_en: "I craft brands and digital experiences people *remember*.",
  intro_mn:
    "Улаанбаатарт төвтэй бие даасан дизайнер. Стартапаас эхлээд том брэндүүдтэй хамтран тэдний түүхийг тод, цэгцтэй, мартагдашгүй дүрслэлээр хүргэдэг.",
  intro_en:
    "Independent designer based in Ulaanbaatar, helping startups and established brands tell their story through clear, distinctive, memorable visuals.",
  about_mn:
    "Би 7 гаруй жил брэнд таних тэмдэг, вэб болон мобайл аппын интерфейс, хэвлэмэл дизайн хийж ирсэн. Миний хувьд сайн дизайн гэдэг нь зөвхөн гоё харагдах биш — хүмүүст ойлгомжтой, хэрэгтэй байх ёстой.\n\nТөсөл бүрийг асуултаас эхэлдэг: энэ брэнд хэнд, юуг, яагаад хэлэх ёстой вэ? Үүний дараа л өнгө, хэлбэр, үсгийн хэв гарч ирдэг.\n\nАжлын бус цагаараа гэрэл зураг авч, хөдөө аялж, Монгол бичгийн хэв судлах дуртай.",
  about_en:
    "For 7+ years I've designed brand identities, web and mobile interfaces, and printed matter. To me, good design isn't just about looking good — it has to be clear and genuinely useful to people.\n\nEvery project starts with questions: who is this brand speaking to, what should it say, and why? Only then do colour, form and type follow.\n\nOff the clock I take photos, travel the countryside and study Mongolian lettering.",
  services_mn: "Брэнд таних тэмдэг\nЛого дизайн\nUI/UX дизайн\nВеб дизайн\nСав баглаа боодол\nПостер ба хэвлэмэл",
  services_en: "Brand identity\nLogo design\nUI/UX design\nWeb design\nPackaging\nPosters & print",
  location_mn: "Улаанбаатар, Монгол",
  location_en: "Ulaanbaatar, Mongolia",
  email: "hello@example.com",
  phone: "+976 0000 0000",
  avatar: null,
  socials: [
    { label: "Behance", url: "https://www.behance.net/" },
    { label: "Dribbble", url: "https://dribbble.com/" },
    { label: "Instagram", url: "https://www.instagram.com/" },
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
  ],
  available: true,
  accent: "",
  canvas_bg: { work: "", about: "", contact: "" },
};

export const demoCategories: Category[] = [
  { id: "c-brand", slug: "branding", name_mn: "Брэнд", name_en: "Branding", sort_order: 0 },
  { id: "c-ui", slug: "ui-ux", name_mn: "UI/UX", name_en: "UI/UX", sort_order: 1 },
  { id: "c-print", slug: "print", name_mn: "Постер", name_en: "Print", sort_order: 2 },
  { id: "c-pack", slug: "packaging", name_mn: "Сав баглаа", name_en: "Packaging", sort_order: 3 },
];

const base = {
  external_url: "",
  published: true,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

export const demoProjects: Project[] = [
  {
    ...base,
    id: "p-nomad",
    slug: "nomad-coffee",
    title_mn: "Nomad Coffee",
    title_en: "Nomad Coffee",
    summary_mn: "Нүүдэлчин соёлоос санаа авсан кофе шарагчийн брэнд таних тэмдэг.",
    summary_en: "A brand identity for a specialty roaster, inspired by nomadic culture.",
    description_mn:
      "Nomad Coffee нь Улаанбаатарын шинэ үеийн кофе шарагч. Бид тэдэнтэй хамтран нүүдэлчдийн аялал, дулаан уур амьсгалыг орчин үеийн, цэвэрхэн дүрслэлээр илэрхийлэх брэнд бүтээсэн.\n\nЛогоны дугуй хэлбэр нь гэрийн тооно болон кофены үрийг зэрэг санагдуулна. Шаргал улбар өнгө нь шарсан кофе, говийн элсийг илэрхийлнэ.",
    description_en:
      "Nomad Coffee is a new-wave roaster in Ulaanbaatar. Together we built a brand that captures the warmth and journey of nomadic life through a modern, clean visual language.\n\nThe circular mark recalls both the ger's crown and a coffee bean, while the burnt-orange palette nods to roasted beans and Gobi sand.",
    role_mn: "Брэнд стратеги, таних тэмдэг",
    role_en: "Brand strategy, identity",
    client: "Nomad Coffee",
    year: 2025,
    tools: ["Illustrator", "Figma", "Photoshop"],
    category_id: "c-brand",
    cover: img("nomad-cover", 1600, 1200),
    gallery: [img("nomad-1", 1600, 1000, true), img("nomad-2", 1200, 1500), img("nomad-cover", 1600, 1200)],
    featured: true,
    sort_order: 0,
  },
  {
    ...base,
    id: "p-steppe",
    slug: "steppe-banking-app",
    title_mn: "Steppe — банкны апп",
    title_en: "Steppe Banking App",
    summary_mn: "Залуу хэрэглэгчдэд зориулсан хялбар, хурдан мобайл банк.",
    summary_en: "A simple, fast mobile bank designed for a younger generation.",
    description_mn:
      "Steppe нь залуучуудад зориулсан дижитал банк. Хэрэглэгчийн судалгаанаас эхлээд прототип, дизайн систем хүртэл бүх шатыг хариуцан ажилласан.\n\nГол зорилго нь гүйлгээ хийх алхмыг 5-аас 2 болгож багасгах байсан бөгөөд туршилтын үр дүнд хэрэглэгчийн сэтгэл ханамж 38%-иар өссөн.",
    description_en:
      "Steppe is a digital bank for young people. I owned every stage from user research through prototyping to the design system.\n\nThe core goal was cutting a transfer from five steps to two — usability testing showed satisfaction rising by 38%.",
    role_mn: "UX судалгаа, UI дизайн, дизайн систем",
    role_en: "UX research, UI design, design system",
    client: "Steppe Fintech",
    year: 2024,
    tools: ["Figma", "Protopie", "Maze"],
    category_id: "c-ui",
    cover: img("steppe-cover", 1600, 1200),
    gallery: [img("steppe-1", 1600, 1000, true), img("steppe-cover", 1600, 1200, true)],
    featured: true,
    sort_order: 1,
  },
  {
    ...base,
    id: "p-altai",
    slug: "altai-ultra-trail",
    title_mn: "Altai Ultra Trail",
    title_en: "Altai Ultra Trail",
    summary_mn: "Алтайн нурууны 100 км уулын гүйлтийн постер ба визуал.",
    summary_en: "Poster series and visuals for a 100 km mountain race in the Altai.",
    description_mn:
      "Уулын гүйлтийн тэмцээний постер, сошиал контент, медалийн дизайн. Уулсын тод силуэт, нэг тод өнгө ашиглан хол зайнаас ч танигдахуйц дүрслэл бүтээсэн.",
    description_en:
      "Posters, social content and medal design for a mountain race. Bold ridge silhouettes and a single loud colour make it recognisable from across the street.",
    role_mn: "Арт дирекшн, постер",
    role_en: "Art direction, posters",
    client: "Altai Sports",
    year: 2025,
    tools: ["Illustrator", "InDesign"],
    category_id: "c-print",
    cover: img("altai-cover", 1200, 1500),
    gallery: [img("altai-1", 1600, 1000, true), img("altai-cover", 1200, 1500)],
    featured: true,
    sort_order: 2,
  },
  {
    ...base,
    id: "p-orchid",
    slug: "orchid-skincare",
    title_mn: "Orchid арьс арчилгаа",
    title_en: "Orchid Skincare",
    summary_mn: "Байгалийн гаралтай арьс арчилгааны брэндийн сав баглаа боодол.",
    summary_en: "Packaging for a natural skincare line.",
    description_mn:
      "Зөөлөн, тайван өнгө, гөлгөр хэлбэрүүдээр бүтээгдэхүүний байгалийн, эмзэг чанарыг илэрхийлсэн сав баглаа боодлын цуврал.",
    description_en:
      "A packaging family that uses soft, calm tones and smooth forms to express the natural, gentle character of the products.",
    role_mn: "Сав баглаа боодол, 3D дүрслэл",
    role_en: "Packaging, 3D visuals",
    client: "Orchid Lab",
    year: 2024,
    tools: ["Illustrator", "Blender"],
    category_id: "c-pack",
    cover: img("orchid-cover", 1600, 1200),
    gallery: [img("orchid-1", 1200, 1500), img("orchid-cover", 1600, 1200)],
    featured: true,
    sort_order: 3,
  },
  {
    ...base,
    id: "p-tsagaan",
    slug: "tsagaan-sar-festival",
    title_mn: "Цагаан сарын баяр",
    title_en: "Tsagaan Sar Festival",
    summary_mn: "Уламжлалт хээг орчин үеийн хэлбэрээр шийдсэн баярын визуал.",
    summary_en: "Festival visuals reimagining traditional patterns in a modern form.",
    description_mn:
      "Хотын төвд болсон Цагаан сарын арга хэмжээний постер, урилга, дэлгэцийн контент. Уламжлалт хээг энгийн дугуй хэлбэрүүдэд хувиргасан.",
    description_en:
      "Posters, invitations and screen content for a city-centre Lunar New Year event, distilling traditional ornament into simple circular forms.",
    role_mn: "Визуал дизайн",
    role_en: "Visual design",
    client: "UB City",
    year: 2023,
    tools: ["Illustrator", "After Effects"],
    category_id: "c-print",
    cover: img("tsagaan-cover", 1600, 1200),
    gallery: [img("tsagaan-cover", 1600, 1200, true)],
    featured: false,
    sort_order: 4,
  },
  {
    ...base,
    id: "p-gobi",
    slug: "gobi-sans-typeface",
    title_mn: "Gobi Sans үсгийн хэв",
    title_en: "Gobi Sans Typeface",
    summary_mn: "Монгол кирилл үсэгт зориулсан 9 жинтэй үсгийн хэв.",
    summary_en: "A 9-weight typeface built for Mongolian Cyrillic.",
    description_mn:
      "Ө, Ү үсгүүдийг латин үсэгтэй тэнцвэртэй харагдуулахад онцгой анхаарсан, дэлгэц болон хэвлэлд аль алинд нь тохирох sans-serif үсгийн хэв.",
    description_en:
      "A sans-serif for screen and print, with special care taken to balance Ө and Ү alongside Latin letters.",
    role_mn: "Үсгийн хэвийн дизайн",
    role_en: "Type design",
    client: "Хувийн төсөл",
    year: 2023,
    tools: ["Glyphs", "Figma"],
    category_id: "c-brand",
    cover: img("gobi-cover", 1600, 1200),
    gallery: [img("gobi-1", 1600, 1000, true)],
    featured: false,
    sort_order: 5,
  },
];
