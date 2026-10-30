import Link from "next/link";
import { RefreshOnFocus } from "@/components/RefreshOnFocus";

const NAV = [
  { href: "/", label: "一覧", icon: "📅" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <RefreshOnFocus />
      <header className="sticky top-0 z-10 border-b border-teal-100 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-lg font-bold text-teal-600">
          🚗 送迎当番
        </Link>
      </header>
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-xl grid-cols-2">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 text-xs text-stone-600 active:bg-stone-100"
              >
                <span className="text-lg leading-none" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
