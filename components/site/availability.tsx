import { cn } from "@/lib/utils";

export function Availability({ available, label }: { available: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-bg/60 py-1.5 pr-3.5 pl-2.5 text-xs backdrop-blur-sm">
      <span
        className={cn("size-2 rounded-full", available ? "animate-pulse-dot bg-accent" : "bg-faint")}
      />
      {label}
    </span>
  );
}
