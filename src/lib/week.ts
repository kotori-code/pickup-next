// 週と日付の計算。Vercel のサーバーは UTC で動くので、「今日」は必ず日本時間で決める。
// 日付は YYYY-MM-DD の文字列のまま扱い、計算するときだけ UTC の Date にする

/** 画面に出す曜日。index は isoWeekday（1=月 … 7=日）- 1 */
export const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** 表示できる週。今週と来週だけ */
export type WeekOffset = 0 | 1;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 日本時間の今日（YYYY-MM-DD） */
export function todayInTokyo(now: Date = new Date()): string {
  // en-CA は YYYY-MM-DD の形で出る
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** YYYY-MM-DD の形で、実在する日付か（2026-02-30 などは false） */
export function isValidDate(value: string): boolean {
  return (
    DATE_PATTERN.test(value) &&
    toUtc(value).toISOString().slice(0, 10) === value
  );
}

/** n 日後（マイナスなら前）の日付 */
export function addDays(date: string, days: number): string {
  const value = toUtc(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** 曜日。1=月 … 7=日 */
export function isoWeekday(date: string): number {
  return toUtc(date).getUTCDay() || 7;
}

/** today を含む週（offset が 1 なら次の週）の月曜日。月曜 0:00 に週が切り替わる */
export function weekStart(today: string, offset: WeekOffset = 0): string {
  return addDays(today, 1 - isoWeekday(today) + offset * 7);
}

/** 月曜日から日曜日までの 7 日 */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** URL の ?week= を読む。next のときだけ来週 */
export function parseWeekOffset(
  value: string | string[] | undefined,
): WeekOffset {
  return value === "next" ? 1 : 0;
}

/** その日が今週か来週か。どちらでもなければ null（画面で開けない日） */
export function weekOffsetOf(date: string, today: string): WeekOffset | null {
  if (!isValidDate(date)) return null;
  const monday = weekStart(today);
  if (date < monday) return null;
  if (date < addDays(monday, 7)) return 0;
  if (date < addDays(monday, 14)) return 1;
  return null;
}

/** 「11/2(月)」の形 */
export function formatDay(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d}(${WEEKDAY_LABELS[isoWeekday(date) - 1]})`;
}

/** 今日・明日なら「今日」「明日」を前に付ける（通知の文面用） */
export function formatDayWithRelative(date: string, today: string): string {
  if (date === today) return `今日 ${formatDay(date)}`;
  if (date === addDays(today, 1)) return `明日 ${formatDay(date)}`;
  return formatDay(date);
}

/** その日の行先。日ごとに上書きしていればそれ、なければ曜日の固定の行先 */
export function resolveDestination(
  date: string,
  override: string | null | undefined,
  weekly: Record<number, string | null>,
): string | null {
  return override ?? weekly[isoWeekday(date)] ?? null;
}
