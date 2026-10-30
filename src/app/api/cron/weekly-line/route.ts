// Vercel Cron（vercel.json）が毎週日曜の夜に呼ぶ。来週の送る人を LINE に送る

import { safeEqual } from "@/lib/auth";
import { appUrl, lineConfigured, sendWeeklySummary } from "@/lib/server/line";

export async function GET(request: Request) {
  // Vercel Cron は Authorization: Bearer <CRON_SECRET> を付けて呼ぶ。ほかの人には呼ばせない
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`))
    return new Response("unauthorized", { status: 401 });
  if (!lineConfigured())
    return new Response("LINE is not configured", { status: 500 });

  const result = await sendWeeklySummary(appUrl(new URL(request.url).origin));
  console.info("来週の送る人を LINE に送りました", result);
  return Response.json(result, { status: result.failed > 0 ? 500 : 200 });
}
