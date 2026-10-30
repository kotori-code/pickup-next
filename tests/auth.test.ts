import { describe, expect, it } from "vitest";
import {
  isCorrectPassword,
  isValidSession,
  normalizeMember,
  safeEqual,
  safeNextPath,
  sessionToken,
} from "@/lib/auth";

describe("合言葉と Cookie", () => {
  it("正しい合言葉だけを受け付ける", async () => {
    expect(await isCorrectPassword("himitsu2026", "himitsu2026")).toBe(true);
    expect(await isCorrectPassword("himitsu2025", "himitsu2026")).toBe(false);
    expect(await isCorrectPassword("", "himitsu2026")).toBe(false);
  });

  it("合言葉が設定されていなければ誰も入れない", async () => {
    expect(await isCorrectPassword("", undefined)).toBe(false);
    expect(await isCorrectPassword("anything", "")).toBe(false);
    expect(await isValidSession(await sessionToken("x"), undefined)).toBe(
      false,
    );
  });

  it("Cookie には合言葉そのものを入れない", async () => {
    const token = await sessionToken("himitsu2026");
    expect(token).not.toContain("himitsu2026");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("合言葉を変えると、それまでの Cookie は使えなくなる", async () => {
    const token = await sessionToken("old-password");
    expect(await isValidSession(token, "old-password")).toBe(true);
    expect(await isValidSession(token, "new-password")).toBe(false);
    expect(await isValidSession(undefined, "old-password")).toBe(false);
  });

  it("safeEqual は長さや中身が違えば false", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("ログイン後の戻り先", () => {
  it("サイトの中のパスはそのまま", () => {
    expect(safeNextPath("/places?visited=no")).toBe("/places?visited=no");
  });

  it("外のサイトへは戻さない", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("名前", () => {
  it("前後の空白を取る", () => {
    expect(normalizeMember("  ママ ")).toBe("ママ");
  });

  it("空や 20 文字を超える名前は使えない", () => {
    expect(normalizeMember("   ")).toBeNull();
    expect(normalizeMember(undefined)).toBeNull();
    expect(normalizeMember("あ".repeat(20))).toBe("あ".repeat(20));
    expect(normalizeMember("あ".repeat(21))).toBeNull();
  });
});
