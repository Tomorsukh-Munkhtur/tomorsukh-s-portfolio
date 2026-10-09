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
import { Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { deleteCategory, reorderCategories, saveCategory } from "@/lib/actions/admin";
import type { CategoryWithCount } from "@/lib/admin-data";
import { cn, slugify } from "@/lib/utils";
import { Button, Card, Input, useToast } from "./ui";

type Draft = { id?: string; name_mn: string; name_en: string; slug: string };

function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => void;
  onCancel?: () => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));

  const update = (patch: Partial<Draft>) =>
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (!slugTouched && ("name_en" in patch || "name_mn" in patch)) next.slug = slugify(next.name_en || next.name_mn);
      return next;
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr_160px_auto]"
    >
      <Input value={draft.name_mn} onChange={(e) => update({ name_mn: e.target.value })} placeholder="Монгол нэр" required autoFocus />
      <Input value={draft.name_en} onChange={(e) => update({ name_en: e.target.value })} placeholder="English name" />
      <Input
        value={draft.slug}
        onChange={(e) => {
          setSlugTouched(true);
          update({ slug: slugify(e.target.value) });
        }}
        placeholder="slug"
        className="font-mono text-xs"
      />
      <div className="flex gap-1">
        <Button type="submit" variant="accent" disabled={pending || !draft.name_mn.trim()}>
          {initial.id ? <Check className="size-4" /> : <Plus className="size-4" />}
          {initial.id ? "Хадгалах" : "Нэмэх"}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} aria-label="Болих">
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

function Row({
  category,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  pending,
}: {
  category: CategoryWithCount;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line bg-elev p-2.5",
        isDragging && "relative z-10 shadow-2xl",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Чирж эрэмбэлэх"
        className="grid h-10 w-6 cursor-grab touch-none place-items-center text-faint hover:text-fg"
      >
        <GripVertical className="size-4" />
      </button>
      {editing ? (
        <CategoryForm initial={category} onSubmit={onSave} onCancel={onCancel} pending={pending} />
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {category.name_mn}
              {category.name_en && <span className="ml-2 font-normal text-muted">/ {category.name_en}</span>}
            </p>
            <p className="font-mono text-xs text-faint">{category.slug}</p>
          </div>
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs text-muted">{category.project_count} бүтээл</span>
          <button
            type="button"
            onClick={onEdit}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg"
            title="Засах"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-red-500/10 hover:text-red-400"
            title="Устгах"
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    </li>
  );
}

export function CategoryManager({ categories }: { categories: CategoryWithCount[] }) {
  const toast = useToast();
  const [items, setItems] = useState(categories);
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Server data refreshes after each action; keep local order in sync.
  const [source, setSource] = useState(categories);
  if (source !== categories) {
    setSource(categories);
    setItems(categories);
  }

  const save = (draft: Draft) =>
    startTransition(async () => {
      const result = await saveCategory({ ...draft, slug: draft.slug || slugify(draft.name_en || draft.name_mn) });
      if (!result.ok) return toast(result.error, "error");
      toast(draft.id ? "Ангилал шинэчлэгдлээ." : "Ангилал нэмэгдлээ.");
      setEditing(null);
      setFormKey((k) => k + 1);
    });

  const remove = (c: CategoryWithCount) => {
    const note = c.project_count ? ` ${c.project_count} бүтээл ангилалгүй болно.` : "";
    if (!confirm(`"${c.name_mn}" ангиллыг устгах уу?${note}`)) return;
    startTransition(async () => {
      const result = await deleteCategory(c.id);
      if (!result.ok) return toast(result.error, "error");
      toast("Ангилал устгагдлаа.");
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(
      items,
      items.findIndex((c) => c.id === active.id),
      items.findIndex((c) => c.id === over.id),
    );
    setItems(next);
    startTransition(async () => {
      const result = await reorderCategories(next.map((c) => c.id));
      if (result.ok) toast("Дараалал хадгалагдлаа.");
      else {
        setItems(before);
        toast(result.error, "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 text-sm font-medium">Шинэ ангилал</h2>
        <CategoryForm key={formKey} initial={{ name_mn: "", name_en: "", slug: "" }} onSubmit={save} pending={pending} />
      </Card>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Ангилал алга. Дээрээс нэмнэ үү.</p>
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((c) => (
                <Row
                  key={c.id}
                  category={c}
                  editing={editing === c.id}
                  onEdit={() => setEditing(c.id)}
                  onCancel={() => setEditing(null)}
                  onSave={save}
                  onDelete={() => remove(c)}
                  pending={pending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
