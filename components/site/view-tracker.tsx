"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";

const VISITOR_KEY = "vid";

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Record one anonymous view of a path (also used for projects opened in the canvas sheet). */
export function trackView(path: string) {
  const payload = JSON.stringify({ path, referrer: document.referrer, visitor: visitorId() });
  const blob = new Blob([payload], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/track", blob)) {
    fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}

function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackView(pathname);
  }, [pathname]);

  return null;
}

/** Records one anonymous page view per navigation. */
export function ViewTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
