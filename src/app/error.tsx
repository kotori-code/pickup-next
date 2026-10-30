"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-bold">うまく読み込めませんでした</h1>
      <p className="mt-2 text-sm text-stone-500">
        通信の状態を確かめて、もう一度試してください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-teal-500 px-6 py-3 font-bold text-white"
      >
        もう一度読み込む
      </button>
    </main>
  );
}
