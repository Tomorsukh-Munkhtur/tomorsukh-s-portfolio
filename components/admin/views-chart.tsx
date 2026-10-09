"use client";

import { useEffect, useRef, useState } from "react";
import { formatDay } from "@/lib/format";

type Point = { day: string; views: number; visitors: number };

const HEIGHT = 240;
const PAD = { top: 28, right: 4, bottom: 28, left: 40 };
const GAP = 2;
const MAX_BAR = 24;
const RADIUS = 4;

const nf = new Intl.NumberFormat("en-US");

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s * 4 >= value) ?? magnitude * 10;
  return step * 4;
}

const shortDate = (day: string) => {
  const [, m, d] = day.split("-");
  return `${Number(m)}/${Number(d)}`;
};

/** Column with a 4px rounded data end and a square baseline. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Daily page views as a single-series column chart with per-bar tooltips and a table view. */
export function ViewsChart({ data }: { data: Point[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(0, ...data.map((d) => d.views)));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const band = innerW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(MAX_BAR, band - GAP));
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const peak = data.reduce((best, d, i) => (d.views > data[best].views ? i : best), 0);
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 64)));

  const hovered = active !== null ? data[active] : null;
  const tipX = active !== null ? PAD.left + band * active + band / 2 : 0;

  return (
    <div>
      <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(null)}>
        <svg width={width} height={HEIGHT} role="img" aria-label="Өдөр тутмын үзэлт" className="block overflow-visible">
          {/* Recessive hairline grid + clean y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text
                x={PAD.left - 10}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted font-mono text-[10px] tabular-nums"
              >
                {nf.format(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const h = Math.max(d.views > 0 ? 1 : 0, (d.views / max) * innerH);
            const x = PAD.left + band * i + (band - barW) / 2;
            return (
              <g
                key={d.day}
                tabIndex={0}
                role="button"
                aria-label={`${formatDay(d.day)}: ${d.views} үзэлт, ${d.visitors} зочин`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none"
              >
                {/* Hit target: the whole band, taller than the mark. */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} fill="transparent" />
                {h > 0 && (
                  <path
                    d={columnPath(x, y(d.views), barW, h)}
                    style={{
                      fill: active === i ? "var(--accent)" : "var(--chart)",
                      opacity: active !== null && active !== i ? 0.55 : 1,
                      transition: "opacity 150ms, fill 150ms",
                    }}
                  />
                )}
                {i === peak && d.views > 0 && active === null && (
                  <text
                    x={x + barW / 2}
                    y={y(d.views) - 8}
                    textAnchor="middle"
                    className="fill-fg font-mono text-[10px] font-semibold tabular-nums"
                  >
                    {nf.format(d.views)}
                  </text>
                )}
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <text
                    x={PAD.left + band * i + band / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-muted font-mono text-[10px]"
                  >
                    {shortDate(d.day)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeWidth={1} />
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-xl border border-line bg-elev/95 px-3 py-2 shadow-xl backdrop-blur-md"
            style={{ left: Math.min(Math.max(tipX, 80), width - 80) }}
          >
            <p className="text-lg font-semibold tabular-nums">
              {nf.format(hovered.views)} <span className="text-xs font-normal text-muted">үзэлт</span>
            </p>
            <p className="text-xs text-muted">
              {nf.format(hovered.visitors)} зочин · {formatDay(hovered.day)}
            </p>
          </div>
        )}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-fg">Хүснэгтээр харах</summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-elev text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Огноо</th>
                <th className="px-3 py-2 text-right font-medium">Үзэлт</th>
                <th className="px-3 py-2 text-right font-medium">Зочид</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-1.5">{d.day}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.views)}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
