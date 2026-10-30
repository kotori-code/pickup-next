// フォームの検証（日ごとの詳細・曜日ごとの固定の行先）。DB の check 制約と同じ長さにそろえる

export const DESTINATION_MAX_LENGTH = 50;
export const MEMO_MAX_LENGTH = 1000;

export type DayInput = { destination: string | null; memo: string | null };

export type FormResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string> };

type FormLike = { get(name: string): unknown };

/** 前後の空白を取る。空なら null（DB には空文字を入れない） */
function text(form: FormLike, name: string): string | null {
  const value = form.get(name);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed === "" ? null : trimmed;
}

function tooLong(value: string | null, max: number): boolean {
  return value !== null && [...value].length > max;
}

/** 詳細のフォーム。行先が空なら曜日の固定の行先を使う */
export function parseDayForm(form: FormLike): FormResult<DayInput> {
  // メモは改行を残し、行末の空白も残す。全部空白なら null
  const rawMemo = form.get("memo");
  const memo =
    typeof rawMemo === "string" && rawMemo.trim() !== ""
      ? rawMemo.replace(/\r\n/g, "\n").trim()
      : null;
  const destination = text(form, "destination");

  const errors: Record<string, string> = {};
  if (tooLong(destination, DESTINATION_MAX_LENGTH))
    errors.destination = `行先は ${DESTINATION_MAX_LENGTH} 文字までです`;
  if (tooLong(memo, MEMO_MAX_LENGTH))
    errors.memo = `メモは ${MEMO_MAX_LENGTH} 文字までです`;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { destination, memo } };
}

/** 設定のフォーム。weekday-1 … weekday-7 の 7 つ。空ならその曜日は行先なし */
export function parseWeeklyForm(
  form: FormLike,
): FormResult<Record<number, string | null>> {
  const value: Record<number, string | null> = {};
  const errors: Record<string, string> = {};
  for (let weekday = 1; weekday <= 7; weekday++) {
    const destination = text(form, `weekday-${weekday}`);
    if (tooLong(destination, DESTINATION_MAX_LENGTH))
      errors[`weekday-${weekday}`] = `${DESTINATION_MAX_LENGTH} 文字までです`;
    value[weekday] = destination;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value };
}
