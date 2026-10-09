"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type ContactState } from "@/lib/actions/contact";
import { cn } from "@/lib/utils";
import { useLocale } from "./locale-provider";

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const base =
    "peer w-full border-b border-line-strong bg-transparent pt-7 pb-3 text-lg outline-none transition-colors placeholder:text-faint focus:border-fg md:text-xl";
  return (
    <label className="group relative block">
      <span className="eyebrow absolute top-0 left-0 transition-colors group-focus-within:text-fg">
        {label}
        {required && <span className="text-accent-ink"> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={5} placeholder={placeholder} className={cn(base, "resize-none")} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete} className={base} />
      )}
    </label>
  );
}

export function ContactForm() {
  const { dict } = useLocale();
  const c = dict.contact;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-10">
      <div className="grid gap-10 md:grid-cols-2">
        <Field label={c.name} name="name" required autoComplete="name" />
        <Field label={c.email} name="email" type="email" required autoComplete="email" />
      </div>
      <Field label={c.subject} name="subject" />
      <Field label={c.message} name="body" required textarea placeholder={c.messagePlaceholder} />

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent py-4 pr-4 pl-7 text-base font-semibold text-accent-fg transition-transform duration-500 ease-out-expo hover:scale-[1.03] disabled:opacity-70"
        >
          {pending ? c.sending : c.send}
          <span className="grid size-9 place-items-center rounded-full bg-accent-fg text-accent transition-transform duration-500 ease-out-expo group-hover:rotate-[-45deg]">
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
              <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
        </button>

        <AnimatePresence mode="wait">
          {state.status !== "idle" && !pending && (
            <motion.p
              key={state.status}
              role="status"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={cn("text-sm", state.status === "success" ? "text-fg" : "text-red-400")}
            >
              {state.status === "success" ? c.sent : state.status === "invalid" ? c.invalid : c.error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
