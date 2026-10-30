import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { safeNextPath } from "@/lib/auth";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <p className="text-center text-4xl" aria-hidden>
        🚗
      </p>
      <h1 className="mt-2 text-center text-xl font-bold text-teal-600">
        送る人
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-stone-500">
        家族で決めた合言葉を入れてください。
      </p>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { next } = await searchParams;
  return (
    <LoginForm next={safeNextPath(typeof next === "string" ? next : null)} />
  );
}
