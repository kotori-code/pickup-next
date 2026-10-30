import "server-only";
import { db } from "./db";

/** 曜日（1=月 … 7=日）ごとの固定の行先。設定していない曜日は null */
export async function listWeekly(): Promise<Record<number, string | null>> {
  const { data, error } = await (await db())
    .from("pickup_weekly_destinations")
    .select("weekday, destination");
  if (error) throw error;
  const weekly: Record<number, string | null> = {};
  for (let weekday = 1; weekday <= 7; weekday++) weekly[weekday] = null;
  for (const row of data as { weekday: number; destination: string | null }[])
    weekly[row.weekday] = row.destination;
  return weekly;
}

export async function saveWeekly(
  weekly: Record<number, string | null>,
  member: string,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const rows = Object.entries(weekly).map(([weekday, destination]) => ({
    weekday: Number(weekday),
    destination,
    updated_by: member,
    updated_at: updatedAt,
  }));
  const { error } = await (await db())
    .from("pickup_weekly_destinations")
    .upsert(rows);
  if (error) throw error;
}
