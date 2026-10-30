-- 送る人のテーブル（Supabase MCP の apply_migration で適用したものと同じ）
-- places-next と同じ Supabase プロジェクトに相乗りしているので、テーブル名は pickup_ で始める

-- 曜日ごとの固定の行先。weekday は 1=月 … 7=日
create table public.pickup_weekly_destinations (
  weekday smallint primary key check (weekday between 1 and 7),
  destination text check (char_length(destination) between 1 and 50),
  updated_by text not null,
  updated_at timestamptz not null default now()
);

-- 日ごとの記録。destination が null なら曜日の固定の行先を使う。driver が null なら未定
create table public.pickup_days (
  date date primary key,
  driver text check (driver in ('papa', 'mama')),
  destination text check (char_length(destination) between 1 and 50),
  memo text check (char_length(memo) between 1 and 1000),
  updated_by text not null,
  updated_at timestamptz not null default now()
);

-- プッシュ通知の宛先（端末ごと）。member は購読したときの名前
create table public.pickup_push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  member text not null,
  created_at timestamptz not null default now()
);

-- サーバー側（secret キー）からだけ読み書きする。ポリシーは作らない
alter table public.pickup_weekly_destinations enable row level security;
alter table public.pickup_days enable row level security;
alter table public.pickup_push_subscriptions enable row level security;

-- 週に 1 回、来週の送る人を LINE で送る先。公式アカウントを招待したグループ（group）か、友だち追加した人（user）
create table public.pickup_line_targets (
  id text primary key,
  type text not null check (type in ('group', 'user')),
  created_at timestamptz not null default now()
);

alter table public.pickup_line_targets enable row level security;
