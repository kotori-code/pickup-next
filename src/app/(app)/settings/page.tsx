import Link from "next/link";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { LineSendButton } from "@/components/LineSendButton";
import { PushToggle } from "@/components/PushToggle";
import { WeeklyForm } from "@/components/WeeklyForm";
import { lineConfigured, listLineTargets } from "@/lib/server/line";
import { currentMember } from "@/lib/server/session";
import { listWeekly } from "@/lib/server/weekly";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-bold">いつもの行先</h1>
        <p className="mt-1 mb-3 text-sm text-stone-500">
          曜日ごとに決まった行先です。一覧に自動で入ります。日ごとに変えたいときは、一覧の行先を押して書き換えてください。
        </p>
        <Suspense fallback={<Loading />}>
          <Weekly />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-2 font-bold">通知</h2>
        <PushToggle />
      </section>

      <section>
        <h2 className="mb-2 font-bold">LINE</h2>
        <Suspense fallback={<Loading />}>
          <Line />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-2 font-bold">名前</h2>
        <Suspense>
          <Member />
        </Suspense>
      </section>
    </div>
  );
}

async function Weekly() {
  return <WeeklyForm initial={await listWeekly()} />;
}

async function Member() {
  const member = await currentMember();
  return (
    <p className="rounded-2xl bg-white p-4 text-sm shadow-sm">
      この端末の名前: <span className="font-bold">{member}</span>
      <Link href="/name" className="ml-3 text-teal-600 underline">
        変える
      </Link>
    </p>
  );
}

async function Line() {
  if (!lineConfigured())
    return (
      <p className="rounded-2xl bg-white p-4 text-sm text-stone-600 shadow-sm">
        LINE の公式アカウントの鍵（LINE_CHANNEL_SECRET・LINE_CHANNEL_ACCESS_TOKEN）がまだ設定されていません。
      </p>
    );
  const targets = await listLineTargets();
  const groups = targets.filter((target) => target.type === "group").length;
  const users = targets.length - groups;
  return (
    <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
      <p>毎週日曜日の夜（20 時ごろ）に、来週の送る人と行先を LINE に送ります。</p>
      <p className="mt-2 text-stone-600">
        {targets.length > 0
          ? `送り先: グループ ${groups} つ・1 対 1 のトーク ${users} 人`
          : "送り先がまだありません。公式アカウントを家族の LINE グループに招待してください。"}
      </p>
      {targets.length > 0 && <LineSendButton />}
    </div>
  );
}
