"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/lib/actions/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageDrop } from "./image-drop";
import { Button, Card, Field, Input, LangTabs, Switch, Textarea, useToast } from "./ui";

const CANVAS_PAGES = [
  ["work", "Бүтээл"],
  ["about", "Тухай"],
  ["contact", "Холбоо барих"],
] as const;

/** "" = monochrome (the default): buttons and highlights use the text colour. */
const ACCENTS = ["", "#0d99ff", "#2a35f5", "#9747ff", "#14ae5c", "#d4ff3f", "#ff5b1f", "#e5231b"];

function PasswordCard() {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      if (!isSupabaseConfigured) return toast("Демо горимд нууц үг солих боломжгүй.", "error");
      if (password.length < 8) return toast("Нууц үг дор хаяж 8 тэмдэгт байна.", "error");
      const { error } = await getSupabaseBrowser().auth.updateUser({ password });
      if (error) return toast(error.message, "error");
      setPassword("");
      toast("Нууц үг солигдлоо.");
    });

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium">Нууц үг солих</h2>
      <div className="flex gap-2">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Шинэ нууц үг"
          autoComplete="new-password"
        />
        <Button onClick={submit} disabled={pending || !password}>
          Солих
        </Button>
      </div>
    </Card>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const toast = useToast();
  const [form, setForm] = useState<SettingsInput>(() => ({ ...settings }));
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const onAvatarBusy = useCallback((b: boolean) => setUploading(b), []);

  const set = <K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    startSaving(async () => {
      const socials = form.socials.filter((s) => s.label.trim() && s.url.trim());
      const result = await saveSettings({ ...form, socials });
      if (result.ok) toast("Тохиргоо хадгалагдлаа. Сайт шинэчлэгдсэн.");
      else toast(result.error, "error");
    });

  const l = lang;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium">Танилцуулга</h2>
            <LangTabs value={lang} onChange={setLang} />
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Нэр (кирилл)" hint="Монгол хувилбарт харагдана">
                <Input
                  value={form.name_mn}
                  onChange={(e) => set("name_mn", e.target.value)}
                  placeholder="Төмөрсүх"
                  className="h-12 text-base"
                />
              </Field>
              <Field label="Нэр (латин)" hint="Англи хувилбар болон лого">
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Tumursukh"
                  className="h-12 text-base"
                />
              </Field>
            </div>
            <Field label="Мэргэжил">
              <Input
                value={form[`role_${l}`]}
                onChange={(e) => set(`role_${l}`, e.target.value)}
                placeholder={l === "mn" ? "Брэнд ба дижитал дизайнер" : "Brand & digital designer"}
              />
            </Field>
            <Field
              label="Гол өгүүлбэр (уриа)"
              hint={
                <>
                  Онцлох үгээ <code className="font-mono text-fg">*одоор*</code> хүрээлбэл serif налуу, өнгөтэй харагдана.
                </>
              }
            >
              <Textarea
                value={form[`tagline_${l}`]}
                onChange={(e) => set(`tagline_${l}`, e.target.value)}
                rows={2}
                className="min-h-0 text-base"
              />
            </Field>
            <Field label="Товч танилцуулга" hint="Хайлтын үр дүн болон хуваалцах үед харагдана.">
              <Textarea value={form[`intro_${l}`]} onChange={(e) => set(`intro_${l}`, e.target.value)} rows={3} />
            </Field>
            <Field label="Миний тухай (дэлгэрэнгүй)" hint="Хоосон мөрөөр догол мөр тусгаарлана.">
              <Textarea value={form[`about_${l}`]} onChange={(e) => set(`about_${l}`, e.target.value)} rows={8} />
            </Field>
            <Field
              label="Ур чадвар"
              hint="Мөр бүрт нэг. Зотны «Ур чадвар ба хэрэгсэл» фрейм болон Тухай хуудсанд гарна. Хэрэгслүүдийг бүтээлүүдээс автоматаар цуглуулна."
            >
              <Textarea
                value={form[`services_${l}`]}
                onChange={(e) => set(`services_${l}`, e.target.value)}
                rows={6}
              />
            </Field>
            <Field label="Байршил">
              <Input value={form[`location_${l}`]} onChange={(e) => set(`location_${l}`, e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-medium">Холбоо барих</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="И-мэйл">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value.trim())} />
            </Field>
            <Field label="Утас">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </div>

          <p className="mt-6 mb-2 text-xs font-medium text-muted">Сошиал холбоосууд</p>
          <ul className="space-y-2">
            {form.socials.map((s, i) => (
              <li key={i} className="flex gap-2">
                <Input
                  value={s.label}
                  onChange={(e) =>
                    set("socials", form.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Behance"
                  className="w-36 shrink-0"
                />
                <Input
                  value={s.url}
                  onChange={(e) =>
                    set("socials", form.socials.map((x, j) => (j === i ? { ...x, url: e.target.value.trim() } : x)))
                  }
                  placeholder="https://"
                />
                <Button
                  variant="ghost"
                  aria-label="Хасах"
                  onClick={() => set("socials", form.socials.filter((_, j) => j !== i))}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => set("socials", [...form.socials, { label: "", url: "" }])}
          >
            <Plus className="size-3.5" /> Холбоос нэмэх
          </Button>
        </Card>

        <PasswordCard />
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Button variant="accent" onClick={save} disabled={saving || uploading} className="w-full">
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </Button>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm">Ажлын саналд нээлттэй</p>
              <p className="text-xs text-muted">Зотон болон холбоо барих хэсэгт тэмдэг гарна</p>
            </div>
            <Switch checked={form.available} onChange={(v) => set("available", v)} label="Нээлттэй" />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Тодотгол өнгө</h2>
          <p className="mt-1 mb-3 text-xs text-muted">
            Товч, сонголт зэрэг жижиг тодотголд. Анхдагч нь өнгөгүй (хар-цагаан). Сайтын дэвсгэр Figma шиг саарал хэвээр.
          </p>
          <div className="grid grid-cols-8 gap-1.5">
            {ACCENTS.map((c) => (
              <button
                key={c || "none"}
                type="button"
                onClick={() => set("accent", c)}
                aria-label={c || "Өнгөгүй"}
                title={c || "Өнгөгүй"}
                className={cn(
                  "aspect-square rounded-full border border-line ring-offset-2 ring-offset-elev transition-transform hover:scale-110",
                  form.accent.toLowerCase() === c && "ring-2 ring-fg",
                )}
                style={{ background: c || "linear-gradient(135deg, #ffffff 50%, #1e1e1e 50%)" }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={form.accent || "#1e1e1e"}
              onChange={(e) => set("accent", e.target.value)}
              className="size-10 shrink-0 cursor-pointer rounded-xl border border-line bg-transparent"
            />
            <Input
              value={form.accent}
              onChange={(e) => set("accent", e.target.value.trim())}
              placeholder="Өнгөгүй"
              className="font-mono text-xs"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Зотны дэвсгэр</h2>
          <p className="mt-1 mb-3 text-xs text-muted">
            Нүүр хуудасны хуудас бүрийн анхдагч өнгө. Хоосон бол Figma-ийн саарал (бараан/гэрэл горимоос хамаарна).
            Зочид өөрсдөдөө зориулж сольж болно.
          </p>
          <div className="space-y-2">
            {CANVAS_PAGES.map(([key, label]) => {
              const value = form.canvas_bg[key];
              const setBg = (v: string) => set("canvas_bg", { ...form.canvas_bg, [key]: v });
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs">{label}</span>
                  <input
                    type="color"
                    value={value || "#1e1e1e"}
                    onChange={(e) => setBg(e.target.value)}
                    aria-label={label}
                    className="size-8 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent"
                  />
                  <Input
                    value={value}
                    onChange={(e) => setBg(e.target.value.trim())}
                    placeholder="Анхдагч"
                    className="h-8 font-mono text-xs"
                  />
                  {value && (
                    <button
                      type="button"
                      onClick={() => setBg("")}
                      aria-label="Анхдагч руу буцаах"
                      title="Анхдагч руу буцаах"
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg"
                    >
                      ↺
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium">Профайл зураг</h2>
          <ImageDrop
            value={form.avatar}
            onChange={(v) => set("avatar", v)}
            folder="avatar"
            aspect="aspect-[4/5]"
            onBusyChange={onAvatarBusy}
          />
          <p className="mt-2 text-xs text-faint">&quot;Тухай&quot; хуудсанд харагдана.</p>
        </Card>
      </div>
    </div>
  );
}
