"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ next }: { next: string }) {
  const [error, formAction] = useActionState(loginAction, null);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-bold text-stone-600">合言葉</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton pendingText="確認中…">はじめる</SubmitButton>
    </form>
  );
}
