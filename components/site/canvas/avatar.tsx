import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Img } from "../img";

/** My photo as a small square, or my initial when there is none. */
export function Avatar({ name, image, className }: { name: string; image?: ImageAsset | null; className?: string }) {
  return (
    <span className={cn("relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-fg text-sm font-semibold text-bg", className)}>
      {/* Eager: the same photo is the eager cover portrait, and Next would flag a lazy copy. */}
      {image ? <Img src={image.url} alt="" fill sizes="64px" loading="eager" className="object-cover" /> : name.charAt(0)}
    </span>
  );
}
