import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function StatTile({
  label,
  value,
  suffix,
  delta,
  note,
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  /** Relative change vs the previous period, e.g. 0.23 for +23%. */
  delta?: number | null;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        highlight ? "border-transparent bg-fg text-bg" : "border-line bg-elev",
      )}
    >
      <p className={cn("text-xs", highlight ? "text-bg/60" : "text-muted")}>{label}</p>
      <p className={cn("mt-3 font-semibold tracking-tight", highlight ? "text-5xl" : "text-4xl")}>
        {value >= 10_000 ? compact.format(value) : value.toLocaleString("en-US")}
        {suffix && <span className={cn("ml-1 text-base font-normal", highlight ? "text-bg/60" : "text-muted")}>{suffix}</span>}
      </p>
      {(delta !== undefined || note) && (
        <p className={cn("mt-2 text-xs", highlight ? "text-bg/70" : "text-muted")}>
          {delta !== undefined && delta !== null && (
            <span className={cn("mr-1.5 font-medium", highlight ? "text-bg" : "text-fg")}>
              {delta >= 0 ? "↑" : "↓"} {Math.abs(Math.round(delta * 100))}%
            </span>
          )}
          {note}
        </p>
      )}
    </div>
  );
}
