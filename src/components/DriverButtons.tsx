"use client";

import { useOptimistic, useTransition } from "react";
import { setDriverAction } from "@/app/actions";
import { DRIVERS, nextDriver, type Driver } from "@/lib/driver";

// 光っているときの色。今は同じ色だが、v2.0 でパパを青・ママをピンクにするときはここだけ変える
const LIT_CLASS: Record<Driver, string> = {
  papa: "border-teal-500 bg-teal-500 text-white shadow",
  mama: "border-teal-500 bg-teal-500 text-white shadow",
};

/** パパ/ママのボタン。押すと光り、光っている方をもう一度押すと消える */
export function DriverButtons({
  date,
  driver,
}: {
  date: string;
  driver: Driver | null;
}) {
  // 保存が終わるのを待たずにすぐ光らせる。失敗したら元に戻る
  const [optimistic, setOptimistic] = useOptimistic(driver);
  const [, startTransition] = useTransition();

  function press(pressed: Driver) {
    const next = nextDriver(optimistic, pressed);
    startTransition(async () => {
      setOptimistic(next);
      await setDriverAction(date, next);
    });
  }

  return (
    <div className="flex shrink-0 gap-1.5" role="group" aria-label="送る人">
      {DRIVERS.map(({ value, label }) => {
        const lit = optimistic === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={lit}
            onClick={() => press(value)}
            className={`h-11 w-[3.25rem] rounded-xl border-2 text-sm font-bold transition-colors ${
              lit
                ? LIT_CLASS[value]
                : "border-stone-200 bg-white text-stone-400 active:bg-stone-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
