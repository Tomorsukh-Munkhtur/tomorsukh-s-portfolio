"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "../config";
import { createPublicClient } from "../supabase/public";

export type ContactState = { status: "idle" | "success" | "error" | "invalid" };

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  subject: z.string().trim().max(200),
  body: z.string().trim().min(1).max(5000),
});

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) return { status: "success" };

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    email: String(formData.get("email") ?? "").trim(),
    subject: formData.get("subject") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { status: "invalid" };

  if (!isSupabaseConfigured) return { status: "success" };

  const { error } = await createPublicClient().from("messages").insert(parsed.data);
  if (error) {
    console.error("Failed to save contact message:", error.message);
    return { status: "error" };
  }
  return { status: "success" };
}
