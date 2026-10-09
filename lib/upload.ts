"use client";

import { isSupabaseConfigured, STORAGE_BUCKET } from "./config";
import { getSupabaseBrowser } from "./supabase/client";
import type { ImageAsset } from "./types";

const MAX_SIZE = 2400;
const QUALITY = 0.86;

async function dimensions(file: Blob) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/** Downscale large photos and re-encode as WebP so the site stays light. GIF/SVG pass through. */
async function prepare(file: File) {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    const size = file.type === "image/svg+xml" ? { width: 1600, height: 1200 } : await dimensions(file);
    return { blob: file as Blob, type: file.type, ext: file.type === "image/gif" ? "gif" : "svg", ...size };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (blob && blob.type === "image/webp") return { blob, type: "image/webp", ext: "webp", width, height };

  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!jpeg) throw new Error("Зургийг боловсруулж чадсангүй.");
  return { blob: jpeg, type: "image/jpeg", ext: "jpg", width, height };
}

/** Upload an image straight from the browser to Supabase Storage. */
export async function uploadImage(file: File, folder: "projects" | "avatar"): Promise<ImageAsset> {
  if (!file.type.startsWith("image/")) throw new Error("Зөвхөн зураг оруулна уу.");
  const prepared = await prepare(file);

  // Demo mode: preview locally only.
  if (!isSupabaseConfigured) {
    return { url: URL.createObjectURL(prepared.blob), width: prepared.width, height: prepared.height };
  }

  const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID()}.${prepared.ext}`;
  const storage = getSupabaseBrowser().storage.from(STORAGE_BUCKET);
  const { error } = await storage.upload(path, prepared.blob, {
    contentType: prepared.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Зураг хуулахад алдаа гарлаа: ${error.message}`);

  return {
    url: storage.getPublicUrl(path).data.publicUrl,
    path,
    width: prepared.width,
    height: prepared.height,
  };
}
