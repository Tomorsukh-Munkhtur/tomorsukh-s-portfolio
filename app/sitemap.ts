import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { locales } from "@/lib/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Add the new site's pages here as they are built.
  const paths = [""];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      },
    })),
  );
}
