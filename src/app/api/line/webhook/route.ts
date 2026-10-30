// LINE Developers の Webhook URL に https://…/api/line/webhook を設定する。
// グループへの招待・友だち追加で送り先を覚え、退出・ブロックで忘れる

import {
  type LineEvent,
  targetChanges,
  verifySignature,
  WELCOME_TEXT,
} from "@/lib/line";
import { addLineTarget, removeLineTarget, replyText } from "@/lib/server/line";

export async function POST(request: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.error(
      "LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN がありません",
    );
    return new Response("not configured", { status: 500 });
  }
  const body = await request.text();
  if (!verifySignature(body, request.headers.get("x-line-signature"), secret))
    return new Response("invalid signature", { status: 401 });

  const { events = [] } = JSON.parse(body) as { events?: LineEvent[] };
  for (const change of targetChanges(events)) {
    if (change.kind === "remove") {
      await removeLineTarget(change.id);
      continue;
    }
    await addLineTarget(change.target);
    if (change.replyToken) {
      try {
        await replyText(change.replyToken, WELCOME_TEXT);
      } catch (error) {
        // あいさつが送れなくても、送り先は覚えたままにする
        console.error(error);
      }
    }
  }
  return new Response("OK");
}
