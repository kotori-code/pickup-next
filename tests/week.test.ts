import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDay,
  formatDayWithRelative,
  isoWeekday,
  isValidDate,
  parseWeekOffset,
  resolveDestination,
  todayInTokyo,
  weekDates,
  weekOffsetOf,
  weekStart,
} from "@/lib/week";

describe("todayInTokyo", () => {
  it("UTC で前の日でも日本時間の日付を返す", () => {
    // 2026-11-01 15:00 UTC は 2026-11-02 0:00 JST
    expect(todayInTokyo(new Date("2026-11-01T15:00:00Z"))).toBe("2026-11-02");
    expect(todayInTokyo(new Date("2026-11-01T14:59:59Z"))).toBe("2026-11-01");
  });
});

describe("週の計算", () => {
  it("曜日は月曜が 1、日曜が 7", () => {
    expect(isoWeekday("2026-11-02")).toBe(1);
    expect(isoWeekday("2026-11-08")).toBe(7);
  });

  it("日曜日はその週の月曜日から始まる週に入る", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02");
    expect(weekStart("2026-11-02")).toBe("2026-11-02");
  });

  it("日本時間の月曜 0:00 に新しい週に変わる", () => {
    const sundayNight = todayInTokyo(new Date("2026-11-08T14:59:00Z"));
    const mondayMorning = todayInTokyo(new Date("2026-11-08T15:00:00Z"));
    expect(weekStart(sundayNight)).toBe("2026-11-02");
    expect(weekStart(mondayMorning)).toBe("2026-11-09");
  });

  it("来週は次の月曜日から", () => {
    expect(weekStart("2026-10-30", 1)).toBe("2026-11-02");
  });

  it("月曜日から日曜日までの 7 日を返す（月をまたいでも続く）", () => {
    expect(weekDates("2026-10-26")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("年をまたいで日を足せる", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("?week=next のときだけ来週", () => {
    expect(parseWeekOffset("next")).toBe(1);
    expect(parseWeekOffset(undefined)).toBe(0);
    expect(parseWeekOffset(["next"])).toBe(0);
  });
});

describe("weekOffsetOf", () => {
  const today = "2026-10-30"; // 金曜日。今週は 10/26〜11/1、来週は 11/2〜11/8

  it("今週は 0、来週は 1", () => {
    expect(weekOffsetOf("2026-10-26", today)).toBe(0);
    expect(weekOffsetOf("2026-11-01", today)).toBe(0);
    expect(weekOffsetOf("2026-11-02", today)).toBe(1);
    expect(weekOffsetOf("2026-11-08", today)).toBe(1);
  });

  it("先週と再来週は開けない", () => {
    expect(weekOffsetOf("2026-10-25", today)).toBeNull();
    expect(weekOffsetOf("2026-11-09", today)).toBeNull();
  });

  it("日付でない文字列や存在しない日は開けない", () => {
    expect(weekOffsetOf("2026-10-32", today)).toBeNull();
    expect(weekOffsetOf("abc", today)).toBeNull();
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
});

describe("表示", () => {
  it("「11/2(月)」の形にする", () => {
    expect(formatDay("2026-11-02")).toBe("11/2(月)");
  });

  it("今日と明日は前に付ける", () => {
    expect(formatDayWithRelative("2026-10-30", "2026-10-30")).toBe("今日 10/30(金)");
    expect(formatDayWithRelative("2026-10-31", "2026-10-30")).toBe("明日 10/31(土)");
    expect(formatDayWithRelative("2026-11-02", "2026-10-30")).toBe("11/2(月)");
  });
});

describe("resolveDestination", () => {
  const weekly = { 1: "保育園", 2: "保育園", 3: null, 4: null, 5: "習い事", 6: null, 7: null };

  it("日ごとに上書きしていなければ曜日の固定の行先", () => {
    expect(resolveDestination("2026-11-02", null, weekly)).toBe("保育園");
    expect(resolveDestination("2026-11-06", undefined, weekly)).toBe("習い事");
  });

  it("日ごとに上書きした行先を優先する", () => {
    expect(resolveDestination("2026-11-02", "おばあちゃんの家", weekly)).toBe(
      "おばあちゃんの家",
    );
  });

  it("どちらもなければ null", () => {
    expect(resolveDestination("2026-11-08", null, weekly)).toBeNull();
  });
});
