// プッシュ通知の文面。送るのは src/lib/server/push.ts

import { driverLabel, type Driver } from "./driver";
import { formatDayWithRelative, weekOffsetOf } from "./week";

export const NOTIFICATION_TITLE = "送迎当番";

export type NotificationPayload = {
  title: string;
  body: string;
  /** 通知を押したときに開くページ */
  url: string;
  /** 同じ日の通知は 1 つにまとめる（新しいもので置き換わる） */
  tag: string;
};

/** トップの、その日がある週のページ */
function weekUrl(date: string, today: string): string {
  return weekOffsetOf(date, today) === 1 ? "/?week=next" : "/";
}

export function driverChangedNotification(
  actor: string,
  date: string,
  driver: Driver | null,
  today: string,
): NotificationPayload {
  const day = formatDayWithRelative(date, today);
  return {
    title: NOTIFICATION_TITLE,
    body: driver
      ? `${actor}さんが ${day} の送りを「${driverLabel(driver)}」にしました`
      : `${actor}さんが ${day} の送りを未定に戻しました`,
    url: weekUrl(date, today),
    tag: `day-${date}`,
  };
}

export function dayChangedNotification(
  actor: string,
  date: string,
  destination: string | null,
  memo: string | null,
  today: string,
): NotificationPayload {
  const day = formatDayWithRelative(date, today);
  const lines = [`${actor}さんが ${day} の予定を更新しました`];
  if (destination) lines.push(`行先: ${destination}`);
  if (memo) {
    // 通知に収まるよう、メモは最初の 60 文字まで
    const chars = [...memo.replace(/\s+/g, " ")];
    lines.push(
      `メモ: ${chars.slice(0, 60).join("")}${chars.length > 60 ? "…" : ""}`,
    );
  }
  return {
    title: NOTIFICATION_TITLE,
    body: lines.join("\n"),
    url: `/days/${date}`,
    tag: `day-${date}`,
  };
}
