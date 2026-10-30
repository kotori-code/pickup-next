"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

/** 送信中は押せなくして、二重に登録されないようにする */
export function SubmitButton({
  children,
  pendingText = "保存中…",
  className,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full rounded-xl bg-teal-500 px-4 py-3 font-bold text-white shadow-sm active:bg-teal-600 disabled:opacity-60"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
