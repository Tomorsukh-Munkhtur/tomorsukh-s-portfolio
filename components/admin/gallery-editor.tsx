"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, Maximize2, Minimize2, X } from "lucide-react";
import { type DragEvent, useEffect, useId, useRef, useState } from "react";
import { Img } from "@/components/site/img";
import type { ImageAsset } from "@/lib/types";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { useToast } from "./ui";

type Item = ImageAsset & { key: string };

/** Stable key per image (duplicates of the same URL are numbered by occurrence). */
function withKeys(images: ImageAsset[]): Item[] {
  const seen = new Map<string, number>();
  return images.map((image) => {
    const base = image.path ?? image.url;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...image, key: n ? `${base}#${n}` : base };
  });
}

function Tile({
  item,
  onToggleWide,
  onRemove,
}: {
  item: Item;
  onToggleWide: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-xl bg-soft",
        item.wide && "col-span-2",
        isDragging && "z-10 shadow-2xl ring-2 ring-accent",
      )}
    >
      <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing">
        <Img src={item.url} alt="" fill sizes="320px" className="pointer-events-none object-cover" />
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={onToggleWide}
          title={item.wide ? "Хагас өргөн болгох" : "Бүтэн өргөнөөр харуулах"}
          className="grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
        >
          {item.wide ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Хасах"
          className="grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-red-500"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {item.wide && (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
          Бүтэн өргөн
        </span>
      )}
    </li>
  );
}

/** Multi-image gallery: drop many files, drag to reorder, mark images full-width. */
export function GalleryEditor({
  value,
  onChange,
  onBusyChange,
}: {
  value: ImageAsset[];
  onChange: (value: ImageAsset[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [over, setOver] = useState(false);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = withKeys(value);
  const strip = (list: Item[]): ImageAsset[] =>
    list.map(({ url, path, width, height, wide }) => ({ url, path, width, height, wide }));

  // Uploads finish in any order; append each to the latest list as soon as it is ready.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    onBusyChange?.(pending > 0);
  }, [pending, onBusyChange]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setPending((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const image = await uploadImage(file, "projects");
          latest.current = [...latest.current, image];
          onChange(latest.current);
        } catch (e) {
          toast((e as Error).message, "error");
        } finally {
          setPending((n) => n - 1);
        }
      }),
    );
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    upload(e.dataTransfer.files);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.key === active.id);
    const to = items.findIndex((i) => i.key === over.id);
    onChange(strip(arrayMove(items, from, to)));
  };

  return (
    <div>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.key)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item, index) => (
              <Tile
                key={item.key}
                item={item}
                onToggleWide={() =>
                  onChange(strip(items.map((it, i) => (i === index ? { ...it, wide: !it.wide } : it))))
                }
                onRemove={() => onChange(strip(items.filter((_, i) => i !== index)))}
              />
            ))}
            {Array.from({ length: pending }, (_, i) => (
              <li key={`pending-${i}`} className="grid aspect-[4/3] place-items-center rounded-xl bg-soft">
                <span className="size-2 animate-ping rounded-full bg-accent" />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-8 text-sm text-muted transition-colors hover:text-fg",
          over ? "border-accent bg-accent/5" : "border-line-strong",
        )}
      >
        <ImagePlus className="size-5" strokeWidth={1.5} />
        Олон зураг зэрэг чирж оруулж болно
      </button>
    </div>
  );
}
