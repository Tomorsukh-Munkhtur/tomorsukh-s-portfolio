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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical, Pencil, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState, useTransition } from "react";
import { Img } from "@/components/site/img";
import { deleteProject, reorderProjects, setProjectFlag } from "@/lib/actions/admin";
import type { Category, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, Input, Switch, useToast } from "./ui";

function Row({
  project,
  category,
  sortable,
  onFlag,
  onDelete,
}: {
  project: Project;
  category?: Category;
  sortable: boolean;
  onFlag: (flag: "published" | "featured", value: boolean) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    disabled: !sortable,
  });
  const [confirming, setConfirming] = useState(false);
  const title = project.title_mn || project.title_en || "Гарчиггүй";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-line bg-elev p-2.5 pr-3 transition-shadow md:gap-4",
        isDragging && "relative z-10 shadow-2xl ring-1 ring-line-strong",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Чирж эрэмбэлэх"
        disabled={!sortable}
        className="grid h-12 w-6 shrink-0 cursor-grab touch-none place-items-center text-faint hover:text-fg active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
      >
        <GripVertical className="size-4" />
      </button>

      <Link href={`/admin/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-soft">
          {project.cover && <Img src={project.cover.url} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted">
            {[category?.name_mn, project.year, project.client].filter(Boolean).join(" · ") || project.slug}
          </p>
        </div>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <span className="hidden text-xs text-muted sm:inline">Устгах уу?</span>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Үгүй
          </Button>
          <Button
            size="sm"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            Устгах
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 md:gap-3">
          <button
            type="button"
            onClick={() => onFlag("featured", !project.featured)}
            aria-pressed={project.featured}
            title={project.featured ? "Онцлохоос хасах" : "Нүүр хуудсанд онцлох"}
            className="grid size-8 place-items-center rounded-full hover:bg-soft"
          >
            <Star className={cn("size-4", project.featured ? "fill-accent stroke-accent-ink" : "text-faint")} />
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className={cn("w-20 text-right text-xs", project.published ? "text-fg" : "text-faint")}>
              {project.published ? "Нийтлэгдсэн" : "Ноорог"}
            </span>
            <Switch
              checked={project.published}
              onChange={(v) => onFlag("published", v)}
              label="Нийтлэх"
            />
          </div>
          {project.published && (
            <a
              href={`/mn/work/${project.slug}`}
              target="_blank"
              title="Сайт дээр үзэх"
              className="hidden size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg md:grid"
            >
              <Eye className="size-4" />
            </a>
          )}
          <Link
            href={`/admin/projects/${project.id}`}
            title="Засах"
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            title="Устгах"
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}

export function ProjectList({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const toast = useToast();
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const q = query.trim().toLowerCase();
  const visible = q
    ? items.filter((p) => [p.title_mn, p.title_en, p.client, p.slug].some((v) => v.toLowerCase().includes(q)))
    : items;

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success: string, rollback: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast(success);
      else {
        rollback();
        toast(result.error ?? "Алдаа гарлаа.", "error");
      }
    });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(
      items,
      items.findIndex((p) => p.id === active.id),
      items.findIndex((p) => p.id === over.id),
    );
    setItems(next);
    run(() => reorderProjects(next.map((p) => p.id)), "Дараалал хадгалагдлаа.", () => setItems(before));
  };

  const onFlag = (id: string, flag: "published" | "featured", value: boolean) => {
    const before = items;
    setItems((list) => list.map((p) => (p.id === id ? { ...p, [flag]: value } : p)));
    const message =
      flag === "published"
        ? value ? "Сайтад нийтлэгдлээ." : "Ноорог болголоо."
        : value ? "Нүүр хуудсанд онцлогдлоо." : "Онцлохоос хасагдлаа.";
    run(() => setProjectFlag(id, flag, value), message, () => setItems(before));
  };

  const onDelete = (id: string) => {
    const before = items;
    setItems((list) => list.filter((p) => p.id !== id));
    run(() => deleteProject(id), "Бүтээл устгагдлаа.", () => setItems(before));
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong px-6 py-20 text-center">
        <p className="text-lg font-medium">Одоогоор бүтээл алга</p>
        <p className="mt-1 text-sm text-muted">Анхны бүтээлээ нэмээд портфолиогоо эхлүүлээрэй.</p>
        <Link
          href="/admin/projects/new"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-fg"
        >
          + Шинэ бүтээл
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Хайх…" className="pl-9" />
      </div>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {visible.map((p) => (
              <Row
                key={p.id}
                project={p}
                category={p.category_id ? byId.get(p.category_id) : undefined}
                sortable={!q}
                onFlag={(flag, value) => onFlag(p.id, flag, value)}
                onDelete={() => onDelete(p.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="mt-4 text-xs text-faint">
        Чирж эрэмбэлсэн дарааллаар сайт дээр харагдана. ★ тэмдэглэсэн бүтээлүүд нүүр хуудсанд гарна.
      </p>
    </div>
  );
}
