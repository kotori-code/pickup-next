import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { targetChanges, verifySignature, weeklyLineMessage } from "@/lib/line";
import { weekDates } from "@/lib/week";

const weekly = {
  1: "保育園",
  2: "保育園",
  3: "スイミング",
  4: "保育園",
  5: "保育園",
  6: null,
  7: null,
};
const url = "https://pickup-next.vercel.app/?week=next";

describe("weeklyLineMessage", () => {
  it("月〜日の送る人と行先を 1 日 1 行でまとめる", () => {
    const text = weeklyLineMessage(
      weekDates("2026-11-02"),
      {
        "2026-11-02": { driver: "papa", destination: null, memo: null },
        "2026-11-03": {
          driver: "mama",
          destination: "おばあちゃんの家",
          memo: "お昼を食べてから帰る",
        },
        "2026-11-04": { driver: "mama", destination: null, memo: null },
        "2026-11-05": { driver: "papa", destination: null, memo: null },
        "2026-11-06": { driver: "mama", destination: null, memo: null },
      },
      weekly,
      url,
    );
    expect(text).toBe(
      [
        "【送る人】来週 11/2(月)〜11/8(日)",
        "11/2(月) パパ／保育園",
        "11/3(火) ママ／おばあちゃんの家",
        "　📝 お昼を食べてから帰る",
        "11/4(水) ママ／スイミング",
        "11/5(木) パパ／保育園",
        "11/6(金) ママ／保育園",
        "11/7(土) ―",
        "11/8(日) ―",
        "",
        "変えるときはこちら",
        url,
      ].join("\n"),
    );
  });

  it("行先があるのに送る人が決まっていない日を数える", () => {
    const text = weeklyLineMessage(weekDates("2026-11-02"), {}, weekly, url);
    expect(text).toContain("11/2(月) 未定／保育園");
    expect(text).toContain("※ 送る人が未定の日が 5 日あります");
  });

  it("行先のない日でも送る人が決まっていれば出す", () => {
    const text = weeklyLineMessage(
      weekDates("2026-11-02"),
      { "2026-11-07": { driver: "papa", destination: null, memo: null } },
      weekly,
      url,
    );
    expect(text).toContain("11/7(土) パパ\n");
  });

  it("長いメモは 40 文字で切り、改行は空白にする", () => {
    const text = weeklyLineMessage(
      weekDates("2026-11-02"),
      {
        "2026-11-02": {
          driver: "papa",
          destination: null,
          memo: `あ\n${"い".repeat(50)}`,
        },
      },
      weekly,
      url,
    );
    expect(text).toContain(`　📝 あ ${"い".repeat(38)}…\n`);
  });
});

describe("verifySignature", () => {
  const secret = "channel-secret";
  const body = '{"events":[]}';
  const signature = createHmac("sha256", secret).update(body).digest("base64");

  it("チャネルシークレットで作った署名なら通す", () => {
    expect(verifySignature(body, signature, secret)).toBe(true);
  });

  it("本文が変わっていたり署名がなかったりしたら通さない", () => {
    expect(verifySignature('{"events":[1]}', signature, secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, "abc", secret)).toBe(false);
  });
});

describe("targetChanges", () => {
  it("グループへの招待と友だち追加で送り先を足す", () => {
    expect(
      targetChanges([
        {
          type: "join",
          replyToken: "r1",
          source: { type: "group", groupId: "C1" },
        },
        {
          type: "follow",
          replyToken: "r2",
          source: { type: "user", userId: "U1" },
        },
      ]),
    ).toEqual([
      { kind: "add", target: { id: "C1", type: "group" }, replyToken: "r1" },
      { kind: "add", target: { id: "U1", type: "user" }, replyToken: "r2" },
    ]);
  });

  it("退出とブロックで送り先を消す", () => {
    expect(
      targetChanges([
        { type: "leave", source: { type: "group", groupId: "C1" } },
        { type: "unfollow", source: { type: "user", userId: "U1" } },
      ]),
    ).toEqual([
      { kind: "remove", id: "C1" },
      { kind: "remove", id: "U1" },
    ]);
  });

  it("メッセージや複数人トークへの招待は無視する", () => {
    expect(
      targetChanges([
        { type: "message", source: { type: "group", groupId: "C1" } },
        { type: "join", source: { type: "room" } },
      ]),
    ).toEqual([]);
  });
});
