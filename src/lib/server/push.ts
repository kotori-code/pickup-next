import "server-only";
import webpush, { type WebPushError } from "web-push";
import type { NotificationPayload } from "@/lib/notification";
import { db } from "./db";

/** ブラウザの PushSubscription を JSON にしたもの */
export type SubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function isSubscriptionJson(value: unknown): value is SubscriptionJson {
  const sub = value as SubscriptionJson | null;
  return (
    typeof sub?.endpoint === "string" &&
    sub.endpoint.startsWith("https://") &&
    typeof sub.keys?.p256dh === "string" &&
    typeof sub.keys?.auth === "string"
  );
}

let configured = false;

/** VAPID の鍵が設定されていれば true。なければ通知は送らない */
function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** 端末の購読を保存する。同じ端末なら名前を今のものに書き換える */
export async function saveSubscription(
  sub: SubscriptionJson,
  member: string,
): Promise<void> {
  const { error } = await (await db())
    .from("pickup_push_subscriptions")
    .upsert({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      member,
    });
  if (error) throw error;
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await (await db())
    .from("pickup_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}

/** 変えた本人以外の端末に通知を送る。失敗しても画面の操作は止めない */
export async function notifyOthers(
  actor: string,
  payload: NotificationPayload,
): Promise<void> {
  if (!configure()) return;
  const { data, error } = await (await db())
    .from("pickup_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .neq("member", actor);
  if (error) throw error;

  const body = JSON.stringify(payload);
  await Promise.all(
    (data as { endpoint: string; p256dh: string; auth: string }[]).map(
      async (row) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            body,
            // 端末の電源が切れていても 1 日は届けるのを待ってもらう
            { TTL: 60 * 60 * 24, urgency: "high" },
          );
        } catch (err) {
          const status = (err as WebPushError).statusCode;
          // 404/410 は購読が解除された端末。次から送らないように消す
          if (status === 404 || status === 410) {
            console.info("解除された購読を消します", status);
            await deleteSubscription(row.endpoint);
          }
          else console.error("通知を送れませんでした", status, err);
        }
      },
    ),
  );
}
