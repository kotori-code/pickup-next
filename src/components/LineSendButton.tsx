"use client";

import { useActionState } from "react";
import { sendWeeklyLineAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

/** 毎週の自動送信を待たずに、来週の分を今すぐ LINE に送る */
export function LineSendButton() {
  const [state, formAction] = useActionState(sendWeeklyLineAction, null);
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <SubmitButton
        pendingText="送っています…"
        className="w-full rounded-xl border border-teal-500 px-4 py-2.5 font-bold text-teal-600 active:bg-teal-50 disabled:opacity-60"
      >
        来週の分を今すぐ LINE に送る
      </SubmitButton>
      {state && (
        <p
          key={state.at}
          role="status"
          className={`text-sm ${state.ok ? "font-bold text-teal-600" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
