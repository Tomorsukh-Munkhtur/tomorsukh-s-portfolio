import { useEffect, useState } from 'react';

/** The year the design career started; years of experience are counted from here. */
export const CAREER_START_YEAR = 2020;

/**
 * Years since CAREER_START_YEAR, worked out in the browser so a page that was
 * statically built in an earlier year never shows a stale number.
 * Returns null on the first render (before the effect runs).
 */
export function useYearsOfExperience() {
  const [years, setYears] = useState<number | null>(null);

  useEffect(() => {
    setYears(new Date().getFullYear() - CAREER_START_YEAR);
  }, []);

  return years;
}
