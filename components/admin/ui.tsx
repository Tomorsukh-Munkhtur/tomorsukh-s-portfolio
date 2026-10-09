"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  use,
  useCallback,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Buttons & inputs
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "accent" | "ghost" | "outline" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-fg text-bg hover:opacity-90",
  accent: "bg-accent text-accent-fg hover:brightness-95",
  ghost: "text-muted hover:bg-soft hover:text-fg",
  outline: "border border-line-strong text-fg hover:bg-soft",
  danger: "text-red-400 hover:bg-red-500/10",
};

export function Button({
  variant = "outline",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        buttonStyles[variant],
        className,
      )}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-line bg-elev px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-line-strong focus:ring-4 focus:ring-accent/15";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, "h-10", className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, "min-h-24 resize-y py-2.5 leading-relaxed", className)} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        checked ? "border-transparent bg-accent" : "border-line-strong bg-soft",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={cn("size-4.5 rounded-full shadow-sm", checked ? "ml-[22px] bg-accent-fg" : "ml-[3px] bg-fg/70")}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-elev p-5 md:p-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** MN / EN tab switch for bilingual fields. */
export function LangTabs({
  value,
  onChange,
}: {
  value: "mn" | "en";
  onChange: (value: "mn" | "en") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line p-0.5 text-xs">
      {(["mn", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={cn(
            "relative isolate rounded-full px-3 py-1 font-mono uppercase transition-colors",
            value === l ? "text-bg" : "text-muted hover:text-fg",
          )}
        >
          {value === l && (
            <motion.span layoutId="lang-tab" className="absolute inset-0 -z-10 rounded-full bg-fg" />
          )}
          {l === "mn" ? "Монгол" : "English"}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

type Toast = { id: number; message: string; tone: "success" | "error" };

const ToastContext = createContext<((message: string, tone?: Toast["tone"]) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3200);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-elev/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl"
            >
              <span
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.tone === "success" ? "bg-accent" : "bg-red-500")}
              />
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const push = use(ToastContext);
  if (!push) throw new Error("useToast must be used inside <ToastProvider>");
  return push;
}
