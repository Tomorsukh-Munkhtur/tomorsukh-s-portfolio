import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { signOut } from "@/lib/actions/admin";
import { getAuthState } from "@/lib/auth";

export const metadata = { title: "Нэвтрэх" };

async function LoginGate() {
  await connection();
  const state = await getAuthState();
  if (state.status === "admin" || state.status === "demo") redirect("/admin");

  if (state.status === "forbidden") {
    return (
      <div className="space-y-4 text-sm">
        <p>
          <span className="font-medium">{state.email}</span> бүртгэлд админ эрх алга.
        </p>
        <p className="text-muted">
          Supabase SQL Editor дээр энэ хэрэглэгчийг <code className="font-mono">admins</code> хүснэгтэд нэмнэ үү
          (README-ийн 3-р алхам).
        </p>
        <form action={signOut}>
          <button className="h-10 w-full rounded-full border border-line-strong text-sm">Гарах</button>
        </form>
      </div>
    );
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-5 py-16">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -z-10 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-[var(--glow-opacity)] blur-[140px]"
      />
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-6 grid size-12 place-items-center rounded-full bg-fg text-bg">
            <span className="size-2.5 rounded-full bg-accent" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Тавтай морил</h1>
          <p className="mt-2 text-sm text-muted">Портфолиогоо удирдахын тулд нэвтэрнэ үү.</p>
        </div>
        <div className="rounded-3xl border border-line bg-elev/80 p-6 backdrop-blur-xl">
          <Suspense fallback={<div className="h-52" />}>
            <LoginGate />
          </Suspense>
        </div>
        <Link href="/" className="mt-8 block text-center text-sm text-muted hover:text-fg">
          ← Сайт руу буцах
        </Link>
      </div>
    </main>
  );
}
