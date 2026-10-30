import Link from "next/link";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { PushToggle } from "@/components/PushToggle";
import { WeeklyForm } from "@/components/WeeklyForm";
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
