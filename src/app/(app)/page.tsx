import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DayRow } from "@/components/DayRow";
import { Loading } from "@/components/Loading";
import { PushToggle } from "@/components/PushToggle";
import { listDays } from "@/lib/server/days";
import { currentMember } from "@/lib/server/session";
import { listWeekly } from "@/lib/server/weekly";
import {
  addDays,
  formatDay,
  parseWeekOffset,
  resolveDestination,
  todayInTokyo,
  weekDates,
  weekStart,
  type WeekOffset,
} from "@/lib/week";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<Loading />}>
      <Week searchParams={searchParams} />
    </Suspense>
  );
}

async function Week({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const offset = parseWeekOffset((await searchParams).week);
  // 「今日」はビルド時ではなく、開いたときの日付にする
  await connection();
  const today = todayInTokyo();
  const monday = weekStart(today, offset);
  const dates = weekDates(monday);
  const [member, days, weekly] = await Promise.all([
    currentMember(),
    listDays(monday, addDays(monday, 6)),
    listWeekly(),
  ]);
  const byDate = new Map(days.map((day) => [day.date, day]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        {member} さん
        <Link href="/name" className="ml-2 text-xs text-teal-600 underline">
          名前を変える
        </Link>
      </p>

      <WeekTabs offset={offset} />
      <p className="text-center text-sm font-bold text-stone-600">
        {formatDay(dates[0])} 〜 {formatDay(dates[6])}
      </p>

      <ul className="space-y-2">
        {dates.map((date) => {
          const day = byDate.get(date);
          return (
            <DayRow
              key={date}
              date={date}
              today={today}
              driver={day?.driver ?? null}
              destination={resolveDestination(date, day?.destination, weekly)}
              hasMemo={Boolean(day?.memo)}
            />
          );
        })}
      </ul>
      <p className="text-center text-xs text-stone-400">
        行先を押すとメモを書けます。毎週月曜日に新しい週に変わります。
      </p>

      <PushToggle compact />
    </div>
  );
}

function WeekTabs({ offset }: { offset: WeekOffset }) {
  const tabs = [
    { href: "/", label: "今週", value: 0 },
    { href: "/?week=next", label: "来週", value: 1 },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          aria-current={tab.value === offset ? "page" : undefined}
          className={`rounded-xl py-2 text-center font-bold ${
            tab.value === offset ? "bg-white text-teal-600 shadow-sm" : "text-stone-500"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
