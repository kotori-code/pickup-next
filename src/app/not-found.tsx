import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-bold">見つかりませんでした</h1>
      <p className="mt-2 text-sm text-stone-500">
        今週と来週の日だけ開けます。URL が間違っているかもしれません。
      </p>
      <Link href="/" className="mt-6 inline-block font-bold text-teal-600">
        今週の一覧へ
      </Link>
    </main>
  );
}
