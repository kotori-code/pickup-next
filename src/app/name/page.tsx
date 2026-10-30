import Link from "next/link";
import { Suspense } from "react";
import { MemberForm } from "@/components/MemberForm";
import { currentMember } from "@/lib/server/session";

export default function NamePage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center text-xl font-bold text-teal-600">
        名前を教えてください
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-stone-500">
        通知に「誰が変えたか」として表示します。この端末で覚えておきます。
      </p>
      <Suspense>
        <Form />
      </Suspense>
    </main>
  );
}

async function Form() {
  const current = await currentMember();
  return (
    <>
      <MemberForm current={current} />
      {current && (
        <Link
          href="/"
          className="mt-4 block text-center text-sm text-stone-500"
        >
          変えずに戻る
        </Link>
      )}
    </>
  );
}
