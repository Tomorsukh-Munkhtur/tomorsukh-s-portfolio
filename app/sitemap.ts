import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getProjects } from "@/lib/data";
import { locales } from "@/lib/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  const paths = ["", ...projects.map((p) => `/work/${p.slug}`)];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      },
    })),
  );
}
