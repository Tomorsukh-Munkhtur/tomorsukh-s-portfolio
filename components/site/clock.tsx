"use client";

import { useEffect, useState } from "react";

const format = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  }).format(new Date());

/** Live Ulaanbaatar time (GMT+8). Rendered only after mount to avoid hydration mismatches. */
export function Clock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(format());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      UB {time ?? "--:--"} <span className="text-faint">GMT+8</span>
    </span>
  );
}
