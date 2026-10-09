import { notFound } from "next/navigation";

// Always a 404, so there is nothing to validate for instant navigation.
export const instant = false;

/** Sends every unknown URL under a locale to the localized not-found page. */
export function generateStaticParams() {
  return [{ rest: ["404"] }];
}

export default function CatchAll() {
  notFound();
}
