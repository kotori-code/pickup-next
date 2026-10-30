import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";

// Supabase には secret キーでサーバーからだけつなぐ。テーブルは RLS オン・ポリシーなしなので、
// ブラウザ用のキーでは読み書きできない
let client: SupabaseClient | undefined;

export async function db(): Promise<SupabaseClient> {
  // 家族のデータがビルド時の静的なページに入らないよう、必ずリクエストが来てから読む
  await connection();
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("SUPABASE_URL と SUPABASE_SECRET_KEY を設定してください");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
