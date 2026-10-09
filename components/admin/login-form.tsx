"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/actions/admin";
import { Button, Field, Input } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <Field label="И-мэйл">
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <Field label="Нууц үг">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </Button>
    </form>
  );
}
