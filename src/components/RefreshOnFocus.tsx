"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** アプリに戻ってきたときに読み直す（ほかの家族が変えた内容をすぐ出すため） */
export function RefreshOnFocus() {
  const router = useRouter();
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);
  return null;
}
