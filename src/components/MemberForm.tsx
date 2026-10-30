"use client";

import { useActionState } from "react";
import { saveMemberAction } from "@/app/actions";
import { MEMBER_MAX_LENGTH } from "@/lib/auth";
import { SubmitButton } from "./SubmitButton";

export function MemberForm({ current }: { current: string | null }) {
  const [error, formAction] = useActionState(saveMemberAction, null);
  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="text-sm font-bold text-stone-600">あなたの名前</span>
        <input
          name="member"
          required
          autoFocus
          maxLength={MEMBER_MAX_LENGTH}
          defaultValue={current ?? ""}
          placeholder="例: パパ、ママ、ことり"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton>{current ? "変更する" : "決める"}</SubmitButton>
    </form>
  );
}
