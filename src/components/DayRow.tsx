import Link from "next/link";
import type { Driver } from "@/lib/driver";
import { isoWeekday, WEEKDAY_LABELS } from "@/lib/week";
import { DriverButtons } from "./DriverButtons";

type Props = {
  date: string;
  today: string;
  driver: Driver | null;
  destination: string | null;
  hasMemo: boolean;
};

const WEEKDAY_COLOR: Record<number, string> = {
  6: "text-sky-600",
  7: "text-rose-500",
};

/** トップの 1 日分。日付・行先（押すと詳細）・送る人 */
export function DayRow({ date, today, driver, destination, hasMemo }: Props) {
  const [, m, d] = date.split("-").map(Number);
  const weekday = isoWeekday(date);
  const isToday = date === today;
  const isPast = date < today;
  return (
    <li
      className={`flex items-center gap-2 rounded-2xl bg-white p-2.5 shadow-sm ${
        isToday ? "ring-2 ring-teal-400" : ""
      } ${isPast ? "opacity-60" : ""}`}
    >
      <div className="w-14 shrink-0 text-center leading-tight">
        <p className="whitespace-nowrap text-lg font-bold tabular-nums">
          {m}/{d}
        </p>
        <p className={`text-xs font-bold ${WEEKDAY_COLOR[weekday] ?? "text-stone-500"}`}>
          {WEEKDAY_LABELS[weekday - 1]}
          {isToday && <span className="ml-0.5 text-teal-600">今日</span>}
        </p>
      </div>
      <Link
        href={`/days/${date}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-xl bg-stone-50 px-2.5 py-2 active:bg-stone-100"
      >
        <span
          className={`line-clamp-2 break-all ${destination ? "font-bold leading-snug" : "text-sm text-stone-400"}`}
        >
          {destination ?? "行先なし"}
        </span>
        {hasMemo && (
          <span className="shrink-0" role="img" aria-label="メモあり">
            📝
          </span>
        )}
      </Link>
      <DriverButtons date={date} driver={driver} />
    </li>
  );
}
