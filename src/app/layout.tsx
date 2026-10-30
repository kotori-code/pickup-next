import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "送迎当番",
  description: "子どもの送り担当と行先を家族で確かめるためのアプリ",
  // 家族だけで使うので検索エンジンに載せない
  robots: { index: false, follow: false },
  appleWebApp: { title: "送迎当番", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-teal-50/40 text-stone-800">{children}</body>
    </html>
  );
}
