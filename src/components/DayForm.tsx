"use client";

import { useActionState } from "react";
import type { DayFormState } from "@/app/actions";
import { DESTINATION_MAX_LENGTH, MEMO_MAX_LENGTH } from "@/lib/forms";
import { SubmitButton } from "./SubmitButton";

type Props = {
  action: (prev: DayFormState, form: FormData) => Promise<DayFormState>;
  /** その曜日の固定の行先。行先を空にしたときに使う */
  weeklyDestination: string | null;
  initial: { destination: string; memo: string };
};

const inputClass =
  "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200";

export function DayForm({ action, weeklyDestination, initial }: Props) {
  const [state, formAction] = useActionState(action, null);
  const values = state?.values ?? initial;
  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-bold text-stone-600">行先</span>
        <input
          name="destination"
          defaultValue={values.destination}
          maxLength={DESTINATION_MAX_LENGTH}
          placeholder={weeklyDestination ?? "例: 保育園"}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-stone-500">
          {weeklyDestination
            ? `空のままなら、いつもの行先（${weeklyDestination}）になります。`
            : "いつもの行先は設定で決められます。"}
        </span>
        {state?.errors.destination && (
          <span className="text-sm text-red-600">{state.errors.destination}</span>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-bold text-stone-600">メモ</span>
        <textarea
          name="memo"
          rows={6}
          defaultValue={values.memo}
          maxLength={MEMO_MAX_LENGTH}
          placeholder="例: お迎えは 16 時。体操服を持っていく"
          className={inputClass}
        />
        {state?.errors.memo && (
          <span className="text-sm text-red-600">{state.errors.memo}</span>
        )}
      </label>
      {state?.errors.form && <p className="text-sm text-red-600">{state.errors.form}</p>}
      <SubmitButton>保存する</SubmitButton>
    </form>
  );
}
