"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Img } from "@/components/site/img";
import type { ImageAsset } from "@/lib/types";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { useToast } from "./ui";

/** Single-image drop zone used for project covers and the profile photo. */
export function ImageDrop({
  value,
  onChange,
  folder,
  aspect = "aspect-[16/10]",
  onBusyChange,
}: {
  value: ImageAsset | null;
  onChange: (value: ImageAsset | null) => void;
  folder: "projects" | "avatar";
  aspect?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    handle(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-dashed transition-colors",
        aspect,
        over ? "border-accent bg-accent/5" : "border-line-strong bg-soft/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {value ? (
        <>
          <Img src={value.url} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-black"
            >
              <Upload className="size-3.5" /> Солих
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs text-white"
            >
              <Trash2 className="size-3.5" /> Хасах
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted hover:text-fg"
        >
          <ImagePlus className="size-6" strokeWidth={1.5} />
          <span>Зураг чирж оруулах эсвэл дарж сонгох</span>
          <span className="text-xs text-faint">JPG, PNG, WebP · автоматаар шахагдана</span>
        </button>
      )}

      {busy && (
        <div className="absolute inset-0 grid place-items-center bg-bg/70 backdrop-blur-sm">
          <span className="flex items-center gap-2 text-sm">
            <span className="size-2 animate-ping rounded-full bg-accent" /> Хуулж байна…
          </span>
        </div>
      )}
    </div>
  );
}
