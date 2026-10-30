import { describe, expect, it } from "vitest";
import { parseDayForm, parseWeeklyForm } from "@/lib/forms";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseDayForm", () => {
  it("前後の空白を取り、空なら null にする", () => {
    expect(parseDayForm(form({ destination: "  ", memo: " \n " }))).toEqual({
      ok: true,
      value: { destination: null, memo: null },
    });
  });

  it("メモの途中の改行は残す", () => {
    const result = parseDayForm(form({ destination: "保育園", memo: "16時\r\n体操服\n" }));
    expect(result).toEqual({
      ok: true,
      value: { destination: "保育園", memo: "16時\n体操服" },
    });
  });

  it("長すぎるとエラー", () => {
    const result = parseDayForm(
      form({ destination: "あ".repeat(51), memo: "い".repeat(1001) }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["destination", "memo"]);
  });

  it("絵文字も 1 文字として数える", () => {
    expect(parseDayForm(form({ destination: "🚗".repeat(50), memo: "" })).ok).toBe(true);
  });
});

describe("parseWeeklyForm", () => {
  it("月〜日の 7 つを読み、空の曜日は null", () => {
    const result = parseWeeklyForm(form({ "weekday-1": " 保育園 ", "weekday-5": "習い事" }));
    expect(result).toEqual({
      ok: true,
      value: { 1: "保育園", 2: null, 3: null, 4: null, 5: "習い事", 6: null, 7: null },
    });
  });

  it("長すぎる曜日だけエラー", () => {
    const result = parseWeeklyForm(form({ "weekday-3": "あ".repeat(51) }));
    expect(result).toEqual({ ok: false, errors: { "weekday-3": "50 文字までです" } });
  });
});
