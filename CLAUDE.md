# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## プロジェクト概要

家族だけで使う「送迎当番」。今週・来週の各日に、子どもを送る人（パパ/ママ）と行先を決め、変わったら家族のスマホにプッシュ通知する。要件は `docs/requirements.md`。

## コマンド

```bash
npm install
npm run dev                          # http://localhost:3000（.env.local が必要）
npm test                             # Vitest（DB にはつながない）
npx vitest run tests/week.test.ts -t "月曜 0:00"   # 1 件だけ
npm run lint
npx tsc --noEmit                     # 型チェック。ルートを足したら先に `npx next typegen`
npm run build
npx vercel deploy --prod --yes --scope kotori-lab   # 本番へ。GitHub との自動連携はない
```

環境変数（`.env.local` と Vercel の Environment Variables）: `APP_PASSWORD`（合言葉・半角英数字）、`SUPABASE_URL`、`SUPABASE_SECRET_KEY`、`NEXT_PUBLIC_VAPID_PUBLIC_KEY`・`VAPID_PRIVATE_KEY`・`VAPID_SUBJECT`（`npx web-push generate-vapid-keys` で作る）。`NEXT_PUBLIC_` はビルド時に埋め込まれるので、変えたらビルドし直す。

## アーキテクチャ

- **アカウントはない。** 家族共通の合言葉 1 つと、端末ごとに選ぶ名前（Cookie）だけ。仕組みは places-next と同じ。
  - `src/proxy.ts` が全ページの前で Cookie `session` を確かめ、なければ `/login`、名前がなければ `/name` へ移す。`sw.js` と `manifest.webmanifest` は通す（ログイン前でもブラウザが取りに来る）。
  - Server Actions は最初に `requireMember()`（`src/lib/server/session.ts`）を呼ぶ。返る名前を `updated_by` と通知の文面に使う。
- **Supabase は places-next のプロジェクトに相乗りしている**（ref `piqrqsobvnbaapmvocsy`）。テーブルは `pickup_` で始める。places-next のテーブルには触らない。RLS オン・ポリシーなしで、secret キーでサーバーからだけ使う。
- `db()` は最初に `connection()` を待つ（`cacheComponents: true` で、家族のデータがビルド時の静的な HTML に入らないように）。DB を読む処理は必ず `db()` を通す。
- **日付は日本時間**（`todayInTokyo()`）で、`YYYY-MM-DD` の文字列のまま扱う（`src/lib/week.ts`）。週は月曜始まり。開ける・書き換えられるのは今週と来週だけ（`weekOffsetOf()`）。「月曜 0:00 にリセット」は表示する週が変わるだけで、記録は消さない。
- 行先は `pickup_days.destination`（日ごとの上書き）→ `pickup_weekly_destinations`（曜日ごと）の順に決まる（`resolveDestination()`）。
- 送る人のボタンは `useOptimistic` ですぐ光らせる。`setDriver` / `saveDay` は前と同じ値なら書き込まず、通知も送らない。
- **プッシュ通知**: `public/sw.js` が受け取って出す。購読は `pickup_push_subscriptions`（endpoint ごと、購読した名前つき）。`notifyOthers()` は変えた本人と同じ名前の端末には送らない。404/410 の購読は消す。Server Action の `after()` で応答のあとに送る。iPhone はホーム画面に追加したときだけ通知を受け取れる。
- 開くたびに `PushToggle` が今の名前で購読を登録し直す（名前を変えたときのため）。
- DB の構造を変えるときは Supabase MCP の `apply_migration` で適用し、`docs/schema.sql` も同じ内容に直す。

## 規約

- コメント・テスト名・画面の文言は日本語。
- ブラウザの `confirm()` などのダイアログは使わない。
- スマホで使う前提。1 カラム・下部のナビ。
