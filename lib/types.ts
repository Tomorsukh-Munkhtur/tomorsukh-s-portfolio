export type Locale = "mn" | "en";

export type ImageAsset = {
  url: string;
  /** Path inside the storage bucket, used for deletion. Absent for demo/external images. */
  path?: string;
  width?: number;
  height?: number;
  /** Gallery only: span the full width of the gallery grid. */
  wide?: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name_mn: string;
  name_en: string;
  sort_order: number;
};

export type Project = {
  id: string;
  slug: string;
  title_mn: string;
  title_en: string;
  summary_mn: string;
  summary_en: string;
  description_mn: string;
  description_en: string;
  role_mn: string;
  role_en: string;
  client: string;
  year: number | null;
  tools: string[];
  category_id: string | null;
  cover: ImageAsset | null;
  gallery: ImageAsset[];
  external_url: string;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SocialLink = { label: string; url: string };

/** Canvas background per home page; "" = the theme's default grey. */
export type CanvasBackgrounds = { work: string; about: string; contact: string };

export type Settings = {
  /** Latin name, also the brand name. */
  name: string;
  /** Cyrillic name shown on the Mongolian site. */
  name_mn: string;
  /** Name in traditional Mongolian script, drawn in the hero. */
  name_script: string;
  role_mn: string;
  role_en: string;
  tagline_mn: string;
  tagline_en: string;
  intro_mn: string;
  intro_en: string;
  about_mn: string;
  about_en: string;
  services_mn: string;
  services_en: string;
  location_mn: string;
  location_en: string;
  email: string;
  phone: string;
  avatar: ImageAsset | null;
  socials: SocialLink[];
  available: boolean;
  accent: string;
  canvas_bg: CanvasBackgrounds;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
};
