"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  COOKIE_MAX_AGE,
  isCorrectPassword,
  MEMBER_COOKIE,
  normalizeMember,
  safeNextPath,
  SESSION_COOKIE,
  sessionToken,
} from "@/lib/auth";
import { isDriver, type Driver } from "@/lib/driver";
import { parseDayForm, parseWeeklyForm } from "@/lib/forms";
import {
  dayChangedNotification,
  driverChangedNotification,
  type NotificationPayload,
} from "@/lib/notification";
import { saveDay, setDriver } from "@/lib/server/days";
import { appUrl, lineConfigured, sendWeeklySummary } from "@/lib/server/line";
import {
  deleteSubscription,
  isSubscriptionJson,
  notifyOthers,
  saveSubscription,
} from "@/lib/server/push";
import { requireMember } from "@/lib/server/session";
import { saveWeekly } from "@/lib/server/weekly";
import { todayInTokyo, weekOffsetOf } from "@/lib/week";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: COOKIE_MAX_AGE,
  path: "/",
};

export async function loginAction(
  _prev: string | null,
  form: FormData,
): Promise<string | null> {
  const password = process.env.APP_PASSWORD;
  if (!password)
    return "合言葉がまだ設定されていません（環境変数 APP_PASSWORD）";

  const input = String(form.get("password") ?? "");
  if (!(await isCorrectPassword(input, password))) {
    // 総当たりで試されにくくするため、間違えたときは少し待たせる
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "合言葉が違います";
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await sessionToken(password), cookieOptions);
  const next = safeNextPath(String(form.get("next") ?? ""));
  redirect(normalizeMember(store.get(MEMBER_COOKIE)?.value) ? next : "/name");
}

export async function saveMemberAction(
  _prev: string | null,
  form: FormData,
): Promise<string | null> {
  const member = normalizeMember(String(form.get("member") ?? ""));
  if (!member) return "名前を 1〜20 文字で入力してください";
  (await cookies()).set(MEMBER_COOKIE, member, cookieOptions);
  redirect("/");
}

/** 応答を返したあとで通知を送る（送り終わるまで画面を待たせない） */
function notifyLater(actor: string, payload: NotificationPayload) {
  after(async () => {
    try {
      await notifyOthers(actor, payload);
    } catch (error) {
      console.error(error);
    }
  });
}

/** 画面で開ける日（今週か来週）か確かめる */
function requireEditableDate(date: string): string {
  const today = todayInTokyo();
  if (weekOffsetOf(date, today) === null)
    throw new Error("今週と来週の日だけ変更できます");
  return today;
}

export async function setDriverAction(
  date: string,
  driver: Driver | null,
): Promise<void> {
  const member = await requireMember();
  if (driver !== null && !isDriver(driver))
    throw new Error("送る人が正しくありません");
  const today = requireEditableDate(date);
  if (await setDriver(date, driver, member))
    notifyLater(member, driverChangedNotification(member, date, driver, today));
  revalidatePath("/", "layout");
}

export type DayFormState = {
  errors: Record<string, string>;
  values: { destination: string; memo: string };
} | null;

export async function saveDayAction(
  date: string,
  _prev: DayFormState,
  form: FormData,
): Promise<DayFormState> {
  const member = await requireMember();
  const today = requireEditableDate(date);
  const values = {
    destination: String(form.get("destination") ?? ""),
    memo: String(form.get("memo") ?? ""),
  };
  const parsed = parseDayForm(form);
  if (!parsed.ok) return { errors: parsed.errors, values };

  try {
    if (await saveDay(date, parsed.value, member))
      notifyLater(
        member,
        dayChangedNotification(
          member,
          date,
          parsed.value.destination,
          parsed.value.memo,
          today,
        ),
      );
  } catch (error) {
    console.error(error);
    return {
      errors: {
        form: "保存できませんでした。時間をおいてもう一度試してください",
      },
      values,
    };
  }
  revalidatePath("/", "layout");
  redirect(weekOffsetOf(date, today) === 1 ? "/?week=next" : "/");
}

export type WeeklyFormState = {
  errors: Record<string, string>;
  saved: boolean;
  /** 保存したときの時刻。同じ結果が続いてもメッセージを出し直すため */
  at: number;
} | null;

export async function saveWeeklyAction(
  _prev: WeeklyFormState,
  form: FormData,
): Promise<WeeklyFormState> {
  const member = await requireMember();
  const parsed = parseWeeklyForm(form);
  if (!parsed.ok)
    return { errors: parsed.errors, saved: false, at: Date.now() };
  try {
    await saveWeekly(parsed.value, member);
  } catch (error) {
    console.error(error);
    return {
      errors: {
        form: "保存できませんでした。時間をおいてもう一度試してください",
      },
      saved: false,
      at: Date.now(),
    };
  }
  revalidatePath("/", "layout");
  return { errors: {}, saved: true, at: Date.now() };
}

export async function savePushSubscriptionAction(sub: unknown): Promise<void> {
  const member = await requireMember();
  if (!isSubscriptionJson(sub))
    throw new Error("通知の登録の内容が正しくありません");
  await saveSubscription(sub, member);
}

export async function deletePushSubscriptionAction(
  endpoint: string,
): Promise<void> {
  await requireMember();
  await deleteSubscription(String(endpoint));
}

export type LineSendState = { message: string; ok: boolean; at: number } | null;

/** 設定画面の「今すぐ LINE に送る」。毎週の自動送信と同じ内容を送る */
export async function sendWeeklyLineAction(): Promise<LineSendState> {
  await requireMember();
  if (!lineConfigured())
    return { message: "LINE の鍵がまだ設定されていません", ok: false, at: Date.now() };
  const host = (await headers()).get("host");
  try {
    const { sent, failed } = await sendWeeklySummary(appUrl(`https://${host}`));
    if (sent === 0 && failed === 0)
      return {
        message: "送り先がありません。公式アカウントをグループに招待してください",
        ok: false,
        at: Date.now(),
      };
    return failed > 0
      ? { message: `${failed} か所に送れませんでした（送れたのは ${sent} か所）`, ok: false, at: Date.now() }
      : { message: `${sent} か所に送りました`, ok: true, at: Date.now() };
  } catch (error) {
    console.error(error);
    return { message: "送れませんでした。時間をおいてもう一度試してください", ok: false, at: Date.now() };
  }
}
