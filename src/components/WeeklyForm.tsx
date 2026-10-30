"use client";

import { useActionState } from "react";
import { saveWeeklyAction } from "@/app/actions";
import { DESTINATION_MAX_LENGTH } from "@/lib/forms";
import { WEEKDAY_LABELS } from "@/lib/week";
import { SubmitButton } from "./SubmitButton";

/** 曜日ごとの固定の行先（月〜日） */
export function WeeklyForm({ initial }: { initial: Record<number, string | null> }) {
  const [state, formAction] = useActionState(saveWeeklyAction, null);
  return (
    <form action={formAction} className="space-y-3">
      <ul className="space-y-2">
        {WEEKDAY_LABELS.map((label, i) => {
          const weekday = i + 1;
          const error = state?.errors[`weekday-${weekday}`];
          return (
            <li key={weekday}>
              <label className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-center font-bold">{label}</span>
                <input
                  name={`weekday-${weekday}`}
                  aria-label={`${label}曜日の行先`}
                  defaultValue={initial[weekday] ?? ""}
                  maxLength={DESTINATION_MAX_LENGTH}
                  placeholder={weekday >= 6 ? "なし" : "例: 保育園"}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </label>
              {error && <p className="ml-11 text-sm text-red-600">{error}</p>}
            </li>
          );
        })}
      </ul>
      {state?.errors.form && <p className="text-sm text-red-600">{state.errors.form}</p>}
      {state?.saved && (
        <p key={state.at} className="text-sm font-bold text-teal-600" role="status">
          保存しました
        </p>
      )}
      <SubmitButton>保存する</SubmitButton>
    </form>
  );
}
