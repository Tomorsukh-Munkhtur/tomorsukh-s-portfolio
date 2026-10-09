"use client";

import { ArrowLeft, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { deleteMessage, setMessageRead } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, useToast } from "./ui";

export function MessageInbox({ messages, openId }: { messages: Message[]; openId?: string }) {
  const toast = useToast();
  // A message opened via ?open= counts as read straight away.
  const [items, setItems] = useState(() =>
    messages.map((m) => (m.id === openId ? { ...m, read: true } : m)),
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<string | null>(openId ?? null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (openId && messages.some((m) => m.id === openId && !m.read)) void setMessageRead(openId, true);
  }, [openId, messages]);

  const visible = filter === "unread" ? items.filter((m) => !m.read) : items;
  const current = items.find((m) => m.id === selected) ?? null;
  const unread = items.filter((m) => !m.read).length;

  const markRead = (id: string, read: boolean, quiet = false) => {
    setItems((list) => list.map((m) => (m.id === id ? { ...m, read } : m)));
    startTransition(async () => {
      const result = await setMessageRead(id, read);
      if (!result.ok && !quiet) toast(result.error, "error");
    });
  };

  const open = (m: Message) => {
    setSelected(m.id);
    if (!m.read) markRead(m.id, true, true);
  };

  const remove = (id: string) => {
    if (!confirm("Энэ мессежийг устгах уу?")) return;
    const before = items;
    setItems((list) => list.filter((m) => m.id !== id));
    setSelected(null);
    startTransition(async () => {
      const result = await deleteMessage(id);
      if (result.ok) toast("Мессеж устгагдлаа.");
      else {
        setItems(before);
        toast(result.error, "error");
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line-strong px-6 py-20 text-center">
        <Mail className="mx-auto mb-4 size-8 text-faint" strokeWidth={1.5} />
        <p className="text-lg font-medium">Мессеж алга</p>
        <p className="mt-1 text-sm text-muted">Сайтын холбоо барих формоор ирсэн мессежүүд энд харагдана.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className={cn(current && "hidden lg:block")}>
        <div className="mb-3 inline-flex rounded-full border border-line p-0.5 text-xs">
          {(
            [
              ["all", `Бүгд (${items.length})`],
              ["unread", `Уншаагүй (${unread})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 transition-colors",
                filter === key ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="space-y-1.5">
          {visible.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => open(m)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-colors",
                  selected === m.id ? "border-line-strong bg-soft" : "border-line bg-elev hover:border-line-strong",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", m.read ? "bg-transparent" : "bg-accent")} />
                  <span className={cn("flex-1 truncate text-sm", !m.read && "font-semibold")}>{m.name}</span>
                  <span className="shrink-0 text-[11px] text-faint">{formatDateTime(m.created_at)}</span>
                </div>
                {m.subject && <p className="mt-1 truncate pl-4 text-sm">{m.subject}</p>}
                <p className="mt-0.5 line-clamp-2 pl-4 text-xs text-muted">{m.body}</p>
              </button>
            </li>
          ))}
          {visible.length === 0 && <li className="py-10 text-center text-sm text-muted">Уншаагүй мессеж алга.</li>}
        </ul>
      </div>

      <div className={cn(!current && "hidden lg:block")}>
        {current ? (
          <article className="rounded-3xl border border-line bg-elev p-6 md:p-8 lg:sticky lg:top-6">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted lg:hidden"
            >
              <ArrowLeft className="size-4" /> Буцах
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-accent text-base font-semibold text-accent-fg">
                  {current.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium">{current.name}</p>
                  <a href={`mailto:${current.email}`} className="text-sm text-muted hover:text-fg">
                    {current.email}
                  </a>
                </div>
              </div>
              <span className="text-xs text-faint">{formatDateTime(current.created_at)}</span>
            </div>
            {current.subject && <h2 className="mt-6 text-xl font-semibold tracking-tight">{current.subject}</h2>}
            <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-wrap">{current.body}</p>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
              <a
                href={`mailto:${current.email}?subject=${encodeURIComponent(`Re: ${current.subject || "Таны мессеж"}`)}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg"
              >
                <Reply className="size-4" /> Хариулах
              </a>
              <Button onClick={() => markRead(current.id, !current.read)}>
                {current.read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                {current.read ? "Уншаагүй болгох" : "Уншсан болгох"}
              </Button>
              <Button variant="danger" onClick={() => remove(current.id)}>
                <Trash2 className="size-4" /> Устгах
              </Button>
            </div>
          </article>
        ) : (
          <div className="grid h-full min-h-80 place-items-center rounded-3xl border border-dashed border-line text-sm text-faint">
            Мессеж сонгоно уу
          </div>
        )}
      </div>
    </div>
  );
}
