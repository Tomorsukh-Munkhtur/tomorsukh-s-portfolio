import { notFound } from "next/navigation";
import { locale } from "next/root-params";
import { hasLocale } from "./i18n";
import type { Locale } from "./types";

/** Current site locale from the `[locale]` root segment. */
export async function getLocale(): Promise<Locale> {
  const value = await locale();
  if (!hasLocale(value)) notFound();
  return value;
}
