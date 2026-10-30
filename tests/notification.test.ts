import { describe, expect, it } from "vitest";
import { dayChangedNotification, driverChangedNotification } from "@/lib/notification";

const today = "2026-10-30";

describe("driverChangedNotification", () => {
  it("誰がどの日を誰にしたかを書く", () => {
    expect(driverChangedNotification("ママ", "2026-10-31", "papa", today)).toEqual({
      title: "送迎当番",
      body: "ママさんが 明日 10/31(土) の送りを「パパ」にしました",
      url: "/",
      tag: "day-2026-10-31",
    });
  });

  it("未定に戻したとき", () => {
    expect(driverChangedNotification("パパ", "2026-10-30", null, today).body).toBe(
      "パパさんが 今日 10/30(金) の送りを未定に戻しました",
    );
  });

  it("来週の日なら来週のページを開く", () => {
    expect(driverChangedNotification("ママ", "2026-11-02", "mama", today).url).toBe(
      "/?week=next",
    );
  });
});

describe("dayChangedNotification", () => {
  it("行先とメモを入れ、その日の詳細を開く", () => {
    const payload = dayChangedNotification("パパ", "2026-11-02", "保育園", "16時\n体操服", today);
    expect(payload.body).toBe(
      "パパさんが 11/2(月) の予定を更新しました\n行先: 保育園\nメモ: 16時 体操服",
    );
    expect(payload.url).toBe("/days/2026-11-02");
  });

  it("長いメモは 60 文字で切る", () => {
    const payload = dayChangedNotification("パパ", "2026-11-02", null, "あ".repeat(80), today);
    expect(payload.body).toBe(`パパさんが 11/2(月) の予定を更新しました\nメモ: ${"あ".repeat(60)}…`);
  });
});
