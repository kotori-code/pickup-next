// 合言葉と Cookie の計算。proxy と Server Actions の両方から使う（Web Crypto だけを使う）

export const SESSION_COOKIE = "session";
export const MEMBER_COOKIE = "member";
/** Cookie の有効期限（秒）。1 年 */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const MEMBER_MAX_LENGTH = 20;

// 合言葉を鍵にして署名する文字列。変えると今までの Cookie はすべて使えなくなる
const SESSION_MESSAGE = "pickup-session-v1";

async function hmacHex(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  return Array.from(new Uint8Array(signature), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** 長さが同じなら、どこで違っても同じ時間で比べる */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 合言葉から Cookie に入れる値を作る。合言葉そのものは Cookie に入れない */
export function sessionToken(password: string): Promise<string> {
  return hmacHex(password, SESSION_MESSAGE);
}

/** Cookie の値が今の合言葉で作ったものか。合言葉が設定されていなければ常に false */
export async function isValidSession(
  cookieValue: string | undefined,
  password: string | undefined,
): Promise<boolean> {
  if (!password || !cookieValue) return false;
  return safeEqual(cookieValue, await sessionToken(password));
}

/** 入力された合言葉が正しいか。文字列を直接比べず、署名した値どうしを比べる */
export async function isCorrectPassword(
  input: string,
  password: string | undefined,
): Promise<boolean> {
  if (!password || !input) return false;
  return safeEqual(await sessionToken(input), await sessionToken(password));
}

/** ログイン後に戻る先。自分のサイトの中のパスだけを許す（`//evil.example` などを防ぐ） */
export function safeNextPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  )
    return "/";
  return next;
}

/** 名前の前後の空白を取り、1〜20 文字なら返す。それ以外は null */
export function normalizeMember(
  name: string | null | undefined,
): string | null {
  const trimmed = (name ?? "").trim();
  if (trimmed.length === 0 || [...trimmed].length > MEMBER_MAX_LENGTH)
    return null;
  return trimmed;
}
