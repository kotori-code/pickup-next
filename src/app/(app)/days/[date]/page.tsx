import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { saveDayAction } from "@/app/actions";
import { DayForm } from "@/components/DayForm";
import { DriverButtons } from "@/components/DriverButtons";
import { Loading } from "@/components/Loading";
import { getDay } from "@/lib/server/days";
import { listWeekly } from "@/lib/server/weekly";
import { formatDay, isoWeekday, todayInTokyo, weekOffsetOf } from "@/lib/week";

export default function DayPage({ params }: PageProps<"/days/[date]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: PageProps<"/days/[date]">["params"] }) {
  const { date } = await params;
  // 「今日」はビルド時ではなく、開いたときの日付にする
  await connection();
  const offset = weekOffsetOf(date, todayInTokyo());
  if (offset === null) notFound();
  const [day, weekly] = await Promise.all([getDay(date), listWeekly()]);
  const backHref = offset === 1 ? "/?week=next" : "/";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{formatDay(date)} の予定</h1>
      <section className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="text-sm font-bold text-stone-600">送る人</span>
        <DriverButtons date={date} driver={day?.driver ?? null} />
      </section>
      <DayForm
        action={saveDayAction.bind(null, date)}
        weeklyDestination={weekly[isoWeekday(date)]}
        initial={{ destination: day?.destination ?? "", memo: day?.memo ?? "" }}
      />
      {day && (
        <p className="text-center text-xs text-stone-400">
          最後に変えた人: {day.updatedBy}
        </p>
      )}
      <Link href={backHref} className="block py-2 text-center text-sm text-stone-500">
        保存せずに戻る
      </Link>
    </div>
  );
}
