import type { ReactNode } from "react";

/** Ranked horizontal bars (one hue, magnitude only). Every value is labelled at the bar tip. */
export function RankBars({
  rows,
  empty,
}: {
  rows: { key: string; label: ReactNode; value: number }[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="py-6 text-sm text-faint">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ol className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.key} className="group">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
              {row.value.toLocaleString("en-US")}
            </span>
          </div>
          <div className="h-2">
            <div
              className="h-full rounded-r-[4px] bg-chart transition-[filter] group-hover:brightness-125"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
