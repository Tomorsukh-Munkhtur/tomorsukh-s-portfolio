"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Img } from "./img";

/** Image that drifts slower than the page while scrolling. */
export function ParallaxImage({
  image,
  alt,
  className,
  sizes = "100vw",
  priority,
}: {
  image: ImageAsset;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-soft", className)}>
      <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0">
        <Img src={image.url} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </motion.div>
    </div>
  );
}
