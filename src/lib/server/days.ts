import "server-only";
import { isDriver, type Driver } from "@/lib/driver";
import type { DayInput } from "@/lib/forms";
import { db } from "./db";

export type Day = {
  date: string;
  driver: Driver | null;
  /** 日ごとに上書きした行先。null なら曜日の固定の行先を使う */
  destination: string | null;
  memo: string | null;
  updatedBy: string;
  updatedAt: string;
};

type DayRow = {
  date: string;
  driver: string | null;
  destination: string | null;
  memo: string | null;
  updated_by: string;
  updated_at: string;
};

function toDay(row: DayRow): Day {
  return {
    date: row.date,
    driver: isDriver(row.driver) ? row.driver : null,
    destination: row.destination,
    memo: row.memo,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/** from〜to（両端を含む）の記録。記録のない日は入らない */
export async function listDays(from: string, to: string): Promise<Day[]> {
  const { data, error } = await (await db())
    .from("pickup_days")
    .select("*")
    .gte("date", from)
    .lte("date", to);
  if (error) throw error;
  return (data as DayRow[]).map(toDay);
}

export async function getDay(date: string): Promise<Day | null> {
  const { data, error } = await (await db())
    .from("pickup_days")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? toDay(data as DayRow) : null;
}

/** 送る人を変える。前と同じなら書き込まず false を返す（通知を送らないため） */
export async function setDriver(
  date: string,
  driver: Driver | null,
  member: string,
): Promise<boolean> {
  const current = await getDay(date);
  if ((current?.driver ?? null) === driver) return false;
  // upsert は渡した列だけを書き換えるので、行先とメモはそのまま残る
  const { error } = await (await db()).from("pickup_days").upsert({
    date,
    driver,
    updated_by: member,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}

/** 行先とメモを保存する。前と同じなら false */
export async function saveDay(
  date: string,
  input: DayInput,
  member: string,
): Promise<boolean> {
  const current = await getDay(date);
  if (
    (current?.destination ?? null) === input.destination &&
    (current?.memo ?? null) === input.memo
  )
    return false;
  const { error } = await (await db()).from("pickup_days").upsert({
    date,
    destination: input.destination,
    memo: input.memo,
    updated_by: member,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}
