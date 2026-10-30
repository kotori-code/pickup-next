import "server-only";
import { randomUUID } from "node:crypto";
import { type LineTarget, weeklyLineMessage } from "@/lib/line";
import { addDays, todayInTokyo, weekDates, weekStart } from "@/lib/week";
import { db } from "./db";
import { listDays } from "./days";
import { listWeekly } from "./weekly";

const LINE_API = "https://api.line.me/v2/bot/message";

/** LINE の鍵が設定されているか */
export function lineConfigured(): boolean {
  return Boolean(
    process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN,
  );
}

async function callLine(
  path: string,
  body: unknown,
  retryKey?: string,
): Promise<void> {
  const res = await fetch(`${LINE_API}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      // 通信が切れて送り直しても、同じメッセージが 2 回届かないようにする
      ...(retryKey ? { "X-Line-Retry-Key": retryKey } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(
      `LINE の API がエラーを返しました: ${res.status} ${await res.text()}`,
    );
}

export function replyText(replyToken: string, text: string): Promise<void> {
  return callLine("reply", { replyToken, messages: [{ type: "text", text }] });
}

export async function listLineTargets(): Promise<LineTarget[]> {
  const { data, error } = await (await db())
    .from("pickup_line_targets")
    .select("id, type")
    .order("created_at");
  if (error) throw error;
  return data as LineTarget[];
}

export async function addLineTarget(target: LineTarget): Promise<void> {
  const { error } = await (await db())
    .from("pickup_line_targets")
    .upsert(target);
  if (error) throw error;
}

export async function removeLineTarget(id: string): Promise<void> {
  const { error } = await (await db())
    .from("pickup_line_targets")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** 来週の送る人のまとめを、登録されたすべての送り先に送る。送れた数と失敗した数を返す */
export async function sendWeeklySummary(
  appUrl: string,
): Promise<{ sent: number; failed: number }> {
  const monday = weekStart(todayInTokyo(), 1);
  const [targets, days, weekly] = await Promise.all([
    listLineTargets(),
    listDays(monday, addDays(monday, 6)),
    listWeekly(),
  ]);
  const text = weeklyLineMessage(
    weekDates(monday),
    Object.fromEntries(days.map((day) => [day.date, day])),
    weekly,
    `${appUrl}/?week=next`,
  );

  let sent = 0;
  let failed = 0;
  for (const target of targets) {
    try {
      await callLine(
        "push",
        { to: target.id, messages: [{ type: "text", text }] },
        randomUUID(),
      );
      sent++;
    } catch (error) {
      // 無料プランの月の上限（429）などで送れなかったとき。ほかの送り先には送り続ける
      console.error("LINE に送れませんでした", error);
      failed++;
    }
  }
  return { sent, failed };
}

/** リンクに使うアプリの URL。Vercel ではプレビューではなく本番の URL にする */
export function appUrl(fallbackOrigin: string): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return fallbackOrigin;
}
