import Image, { type ImageProps } from "next/image";

/** next/image that serves SVGs (demo artwork) as-is instead of through the optimizer. */
export function Img({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image alt={alt} {...props} unoptimized={props.unoptimized ?? src.endsWith(".svg")} />;
}
