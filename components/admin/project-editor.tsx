"use client";

import { ArrowLeft, Eye, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type KeyboardEvent } from "react";
import { deleteProject, saveProject, type ProjectInput } from "@/lib/actions/admin";
import type { Category, Project } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { GalleryEditor } from "./gallery-editor";
import { ImageDrop } from "./image-drop";
import { Button, Card, Field, Input, LangTabs, Switch, Textarea, useToast } from "./ui";

type Form = Omit<ProjectInput, "year"> & { year: string };

const emptyForm = (): Form => ({
  slug: "",
  title_mn: "",
  title_en: "",
  summary_mn: "",
  summary_en: "",
  description_mn: "",
  description_en: "",
  role_mn: "",
  role_en: "",
  client: "",
  year: String(new Date().getFullYear()),
  tools: [],
  category_id: null,
  cover: null,
  gallery: [],
  external_url: "",
  featured: false,
  published: false,
});

function toForm(p: Project): Form {
  return {
    id: p.id,
    slug: p.slug,
    title_mn: p.title_mn,
    title_en: p.title_en,
    summary_mn: p.summary_mn,
    summary_en: p.summary_en,
    description_mn: p.description_mn,
    description_en: p.description_en,
    role_mn: p.role_mn,
    role_en: p.role_en,
    client: p.client,
    year: p.year ? String(p.year) : "",
    tools: p.tools,
    category_id: p.category_id,
    cover: p.cover,
    gallery: p.gallery,
    external_url: p.external_url,
    featured: p.featured,
    published: p.published,
  };
}

function ToolsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const tool = draft.trim().replace(/,$/, "");
    if (tool && !value.includes(tool)) onChange([...value, tool]);
    setDraft("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-elev px-2 py-1.5 focus-within:border-line-strong">
      {value.map((tool) => (
        <span key={tool} className="inline-flex items-center gap-1 rounded-full bg-soft py-0.5 pr-1 pl-2.5 text-xs">
          {tool}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tool))}
            className="grid size-4 place-items-center rounded-full hover:bg-line-strong"
            aria-label={`${tool} хасах`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length ? "" : "Figma, Illustrator… (Enter)"}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-faint"
      />
    </div>
  );
}

export function ProjectEditor({ project, categories }: { project: Project | null; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Form>(() => (project ? toForm(project) : emptyForm()));
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [dirty, setDirty] = useState(false);
  const [uploads, setUploads] = useState({ cover: false, gallery: false });
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = uploads.cover || uploads.gallery;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setDirty(true);
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!slugTouched && (key === "title_en" || key === "title_mn")) {
        next.slug = slugify(next.title_en || next.title_mn);
      }
      return next;
    });
  };

  const onCoverBusy = useCallback((b: boolean) => setUploads((u) => ({ ...u, cover: b })), []);
  const onGalleryBusy = useCallback((b: boolean) => setUploads((u) => ({ ...u, gallery: b })), []);

  const save = useCallback(() => {
    if (busy) {
      toast("Зураг хуулагдаж дуусахыг хүлээнэ үү.", "error");
      return;
    }
    startSaving(async () => {
      const year = form.year.trim() ? Number(form.year) : null;
      const result = await saveProject({ ...form, year, slug: form.slug || slugify(form.title_en || form.title_mn) });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setDirty(false);
      toast("Хадгалагдлаа.");
      if (!form.id && result.data) router.replace(`/admin/projects/${result.data.id}`);
    });
  }, [busy, form, router, toast]);

  // Ctrl/Cmd + S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save, dirty]);

  const remove = () => {
    if (!form.id || !confirm("Энэ бүтээлийг бүр мөсөн устгах уу? Зургууд нь мөн устна.")) return;
    startDeleting(async () => {
      const result = await deleteProject(form.id!);
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setDirty(false);
      toast("Бүтээл устгагдлаа.");
      router.push("/admin/projects");
    });
  };

  const l = lang;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="grid size-10 place-items-center rounded-full border border-line text-muted hover:text-fg"
            aria-label="Буцах"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {form.title_mn || form.title_en || (project ? "Гарчиггүй" : "Шинэ бүтээл")}
            </h1>
            <p className="text-xs text-muted">
              {dirty ? "Хадгалаагүй өөрчлөлт байна" : project ? "Бүх өөрчлөлт хадгалагдсан" : "Ноорог"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project?.published && (
            <a
              href={`/mn/work/${project.slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-muted hover:text-fg"
            >
              <Eye className="size-4" /> Үзэх
            </a>
          )}
          <Button variant="accent" onClick={save} disabled={saving || busy}>
            {saving ? "Хадгалж байна…" : busy ? "Зураг хуулж байна…" : "Хадгалах"}
            <kbd className="hidden rounded bg-accent-fg/10 px-1.5 font-mono text-[10px] md:inline">Ctrl S</kbd>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium">Агуулга</h2>
              <LangTabs value={lang} onChange={setLang} />
            </div>
            <div className="space-y-4">
              <Field label="Гарчиг">
                <Input
                  value={form[`title_${l}`]}
                  onChange={(e) => set(`title_${l}`, e.target.value)}
                  placeholder={l === "mn" ? "Жишээ: Nomad Coffee брэнд" : "e.g. Nomad Coffee identity"}
                  className="h-12 text-base"
                />
              </Field>
              <Field label="Товч тайлбар" hint="Карт болон бүтээлийн хуудасны дээд хэсэгт харагдана.">
                <Textarea
                  value={form[`summary_${l}`]}
                  onChange={(e) => set(`summary_${l}`, e.target.value)}
                  rows={2}
                  className="min-h-0"
                />
              </Field>
              <Field label="Миний үүрэг">
                <Input
                  value={form[`role_${l}`]}
                  onChange={(e) => set(`role_${l}`, e.target.value)}
                  placeholder={l === "mn" ? "Брэнд стратеги, таних тэмдэг" : "Brand strategy, identity"}
                />
              </Field>
              <Field label="Дэлгэрэнгүй тайлбар" hint="Хоосон мөрөөр догол мөр тусгаарлана. Эхний догол мөр томоор харагдана.">
                <Textarea
                  value={form[`description_${l}`]}
                  onChange={(e) => set(`description_${l}`, e.target.value)}
                  rows={9}
                />
              </Field>
            </div>
            <p className="mt-4 text-xs text-faint">
              Нэг хэл дээр хоосон үлдээвэл нөгөө хэлний текст автоматаар харагдана.
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-medium">Нүүр зураг</h2>
            <ImageDrop
              value={form.cover}
              onChange={(v) => set("cover", v)}
              folder="projects"
              onBusyChange={onCoverBusy}
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Зургийн цомог</h2>
              <span className="text-xs text-muted">{form.gallery.length} зураг · чирж эрэмбэлнэ</span>
            </div>
            <GalleryEditor value={form.gallery} onChange={(v) => set("gallery", v)} onBusyChange={onGalleryBusy} />
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="space-y-4">
            <h2 className="text-sm font-medium">Төлөв</h2>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Нийтлэх</p>
                <p className="text-xs text-muted">Унтраавал ноорог болно</p>
              </div>
              <Switch checked={form.published} onChange={(v) => set("published", v)} label="Нийтлэх" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">Онцлох</p>
                <p className="text-xs text-muted">Нүүр хуудсанд гарна</p>
              </div>
              <Switch checked={form.featured} onChange={(v) => set("featured", v)} label="Онцлох" />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-sm font-medium">Дэлгэрэнгүй</h2>
            <Field label="URL нэр (slug)" hint={`/work/${form.slug || "…"}`}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Ангилал">
              <select
                value={form.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value || null)}
                className="h-10 w-full rounded-xl border border-line bg-elev px-3 text-sm outline-none focus:border-line-strong"
              >
                <option value="">— Ангилалгүй —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_mn}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Он">
                <Input
                  value={form.year}
                  onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Үйлчлүүлэгч">
                <Input value={form.client} onChange={(e) => set("client", e.target.value)} />
              </Field>
            </div>
            <Field label="Хэрэгсэл">
              <ToolsInput value={form.tools} onChange={(v) => set("tools", v)} />
            </Field>
            <Field label="Гадаад холбоос" hint="Behance, вебсайт гэх мэт (заавал биш)">
              <Input
                value={form.external_url}
                onChange={(e) => set("external_url", e.target.value.trim())}
                placeholder="https://"
              />
            </Field>
          </Card>

          {project && (
            <Button variant="danger" onClick={remove} disabled={deleting} className="w-full">
              {deleting ? "Устгаж байна…" : "Бүтээлийг устгах"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
