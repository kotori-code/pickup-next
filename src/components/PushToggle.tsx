"use client";

import { useEffect, useState } from "react";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/app/actions";

type Status =
  | "loading"
  | "unsupported" // このブラウザでは使えない
  | "needs-install" // iPhone でホーム画面に追加していない
  | "denied" // 通知を許可しなかった
  | "off"
  | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** VAPID の公開鍵（URL 用の Base64）をブラウザが受け取れる形にする */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function detect(): Promise<Status> {
  if (!PUBLIC_KEY) return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    // 名前を変えたときのために、開くたびに今の名前で登録し直す
    await savePushSubscriptionAction(sub.toJSON());
    return "on";
  }
  return Notification.permission === "denied" ? "denied" : "off";
}

/**
 * 通知を受け取るかどうか。compact のときはまだ受け取っていない端末にだけ案内を出す（トップ用）
 */
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detect()
      .then(setStatus)
      .catch((err) => {
        console.error(err);
        setStatus("unsupported");
      });
  }, []);

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      // iPhone ではボタンを押した流れの中で許可を求めないと、許可の画面が出ない
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
      await savePushSubscriptionAction(sub.toJSON());
      setStatus("on");
    } catch (err) {
      console.error(err);
      setError("通知を登録できませんでした。もう一度試してください");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error(err);
      setError("通知を止められませんでした。もう一度試してください");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;
  if (compact && (status === "on" || status === "unsupported" || status === "denied"))
    return null;

  const box = "rounded-2xl bg-white p-4 text-sm shadow-sm";
  if (status === "needs-install")
    return (
      <div className={box}>
        <p className="font-bold">🔔 通知を受け取るには</p>
        <p className="mt-1 text-stone-600">
          Safari の共有ボタン（□↑）から「ホーム画面に追加」をして、ホーム画面のアイコンから開いてください。
        </p>
      </div>
    );
  if (status === "unsupported")
    return <p className={box}>このブラウザでは通知を受け取れません。</p>;
  if (status === "denied")
    return (
      <p className={box}>
        通知が許可されていません。端末の設定でこのアプリの通知を許可してください。
      </p>
    );

  return (
    <div className={box}>
      {status === "on" ? (
        <>
          <p>🔔 この端末で通知を受け取っています。</p>
          <button
            type="button"
            onClick={unsubscribe}
            disabled={busy}
            className="mt-2 rounded-xl border border-stone-300 px-4 py-2 font-bold text-stone-600 disabled:opacity-60"
          >
            {busy ? "処理中…" : "通知を止める"}
          </button>
        </>
      ) : (
        <>
          <p>ほかの家族が送る人やメモを変えたら、この端末に通知します。</p>
          <button
            type="button"
            onClick={subscribe}
            disabled={busy}
            className="mt-2 w-full rounded-xl bg-teal-500 px-4 py-2.5 font-bold text-white active:bg-teal-600 disabled:opacity-60"
          >
            {busy ? "処理中…" : "🔔 通知を受け取る"}
          </button>
        </>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
