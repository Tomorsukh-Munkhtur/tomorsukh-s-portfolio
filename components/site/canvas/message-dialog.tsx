"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { ContactForm } from "../contact-form";
import { useLocale } from "../locale-provider";

/** Contact form in a modal, opened from the toolbar or the contact frame. */
export function MessageDialog({ onClose }: { onClose: () => void }) {
  const { dict } = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal
        aria-label={dict.canvas.dialogTitle}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-elev p-6 shadow-2xl md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{dict.canvas.dialogTitle}</h2>
            <p className="mt-1 text-sm text-muted">{dict.contact.lead}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.nav.close}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-line-strong"
          >
            ✕
          </button>
        </div>
        <ContactForm />
      </motion.div>
    </motion.div>
  );
}
