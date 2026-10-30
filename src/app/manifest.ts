import type { MetadataRoute } from "next";

// ホーム画面に追加したときの設定。iPhone はホーム画面から開いたときだけ通知を受け取れる
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "送迎当番",
    short_name: "送迎当番",
    description: "子どもの送り担当と行先を家族で確かめるためのアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f0fdfa",
    theme_color: "#14b8a6",
    lang: "ja",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
