"use client";

import { createContext, use, type ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type LocaleContextValue = { locale: Locale; dict: Dictionary };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: LocaleContextValue & { children: ReactNode }) {
  return <LocaleContext value={{ locale, dict }}>{children}</LocaleContext>;
}

export function useLocale() {
  const value = use(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside <LocaleProvider>");
  return value;
}
