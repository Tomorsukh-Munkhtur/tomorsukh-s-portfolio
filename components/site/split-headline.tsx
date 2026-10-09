"use client";

import { motion } from "motion/react";
import { splitWords, WordPieces } from "./emphasis";

/** Headline whose words rise into place one after another. Supports `*em*` markup. */
export function SplitHeadline({
  text,
  className,
  delay = 0.15,
  stagger = 0.055,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "p";
}) {
  const words = splitWords(text);

  return (
    <Tag className={className} aria-label={text.replaceAll("*", "")}>
      {words.map((pieces, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", rotate: 4 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: delay + i * stagger }}
          >
            <WordPieces pieces={pieces} />
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
