// LINE 公式アカウントで送る来週のまとめの文面と、Webhook の読み取り（DB や LINE にはつながない）

import { createHmac, timingSafeEqual } from "node:crypto";
import { driverLabel, type Driver } from "./driver";
import { formatDay, resolveDestination } from "./week";

export type LineTargetType = "group" | "user";
export type LineTarget = { id: string; type: LineTargetType };

/** 文面に使う 1 日分の記録 */
export type DaySummary = {
  driver: Driver | null;
  destination: string | null;
  memo: string | null;
};

// LINE で読みやすいよう、メモは最初の 40 文字まで
const MEMO_MAX_IN_LINE = 40;

function shortMemo(memo: string): string {
  const chars = [...memo.replace(/\s+/g, " ").trim()];
  return chars.length > MEMO_MAX_IN_LINE
    ? `${chars.slice(0, MEMO_MAX_IN_LINE).join("")}…`
    : chars.join("");
}

/** 1 週間分（月〜日）の送る人をまとめた文面 */
export function weeklyLineMessage(
  dates: string[],
  days: Record<string, DaySummary | undefined>,
  weekly: Record<number, string | null>,
  url: string,
): string {
  const lines = [
    `【送る人】来週 ${formatDay(dates[0])}〜${formatDay(dates[dates.length - 1])}`,
  ];
  let undecided = 0;
  for (const date of dates) {
    const day = days[date];
    const destination = resolveDestination(date, day?.destination, weekly);
    const driver = day?.driver ?? null;
    if (!driver && !destination) {
      lines.push(`${formatDay(date)} ―`);
    } else {
      if (!driver) undecided++;
      lines.push(
        `${formatDay(date)} ${driverLabel(driver)}${destination ? `／${destination}` : ""}`,
      );
    }
    if (day?.memo) lines.push(`　📝 ${shortMemo(day.memo)}`);
  }
  if (undecided > 0)
    lines.push("", `※ 送る人が未定の日が ${undecided} 日あります`);
  lines.push("", "変えるときはこちら", url);
  return lines.join("\n");
}

/** LINE からの Webhook か（x-line-signature をチャネルシークレットで確かめる） */
export function verifySignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type: string; groupId?: string; userId?: string };
};

export type TargetChange =
  | { kind: "add"; target: LineTarget; replyToken?: string }
  | { kind: "remove"; id: string };

/** Webhook の出来事から送り先の追加・削除を取り出す。グループへの招待・友だち追加で追加、退出・ブロックで削除 */
export function targetChanges(events: LineEvent[]): TargetChange[] {
  const changes: TargetChange[] = [];
  for (const event of events) {
    const source = event.source;
    if (event.type === "join" && source?.type === "group" && source.groupId)
      changes.push({
        kind: "add",
        target: { id: source.groupId, type: "group" },
        replyToken: event.replyToken,
      });
    else if (
      event.type === "follow" &&
      source?.type === "user" &&
      source.userId
    )
      changes.push({
        kind: "add",
        target: { id: source.userId, type: "user" },
        replyToken: event.replyToken,
      });
    else if (event.type === "leave" && source?.groupId)
      changes.push({ kind: "remove", id: source.groupId });
    else if (event.type === "unfollow" && source?.userId)
      changes.push({ kind: "remove", id: source.userId });
  }
  return changes;
}

/** 招待・友だち追加されたときのあいさつ */
export const WELCOME_TEXT = [
  "「送る人」です。",
  "毎週日曜日の夜に、来週の送る人と行先をここに送ります。",
  "止めたいときは、このアカウントをグループから退出させてください（1 対 1 のトークならブロック）。",
].join("\n");
