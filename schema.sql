-- ============================================================
-- BAR TEVER → 複数店舗対応 データベーススキーマ (Supabase/Postgres想定)
-- 店舗ごとにデータを完全に分離するマルチテナント設計
-- ============================================================

-- 拡張機能（UUID生成用。Supabaseではデフォルトで有効なことが多い）
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. 店舗（テナントの単位。TEVERも1店舗として登録する）
-- ------------------------------------------------------------
create table stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- 例: "BAR TEVER"
  plan        text not null default 'trial' check (plan in ('trial','paid','suspended')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. 店舗メンバー（ログインユーザーと店舗の紐付け）
--    Supabase Authのauth.usersと連携する
-- ------------------------------------------------------------
create table store_members (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner','staff')),
  created_at  timestamptz not null default now(),
  unique (store_id, user_id)
);

-- ------------------------------------------------------------
-- 3. スタッフ（勤怠・歩合の対象。ログインアカウントとは別概念）
-- ------------------------------------------------------------
create table staff (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  name          text not null,
  hourly_wage   numeric,           -- null = 時給未設定
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. メニュー
-- ------------------------------------------------------------
create table menu_items (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  name        text not null,
  price       numeric not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. 伝票（お客様・卓ごとの単位）
--    来店時間 = created_at / 退店時間 = closed_at
-- ------------------------------------------------------------
create table tabs (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  business_date   date not null,      -- 朝6時基準の営業日
  name            text not null,      -- お客様名・卓番
  memo            text not null default '',
  payment_method  text check (payment_method in ('cash','card')),
  created_at      timestamptz not null default now(),  -- 来店
  closed_at       timestamptz                          -- 退店・会計
);

-- ------------------------------------------------------------
-- 6. 伝票の明細（注文品目。担当スタッフを紐付け）
-- ------------------------------------------------------------
create table tab_items (
  id          uuid primary key default gen_random_uuid(),
  tab_id      uuid not null references tabs(id) on delete cascade,
  staff_id    uuid references staff(id) on delete set null,
  name        text not null,
  price       numeric not null check (price >= 0),
  qty         integer not null default 1 check (qty > 0),
  source      text not null default 'manual' check (source in ('menu','manual')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. 出退勤
-- ------------------------------------------------------------
create table attendance (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  staff_id       uuid not null references staff(id) on delete cascade,
  business_date  date not null,
  clock_in       timestamptz not null,
  clock_out      timestamptz,
  wage_snapshot  numeric   -- 出勤時点の時給を記録（後で時給を変更しても過去分は変わらない）
);

-- ------------------------------------------------------------
-- 8. 経費
-- ------------------------------------------------------------
create table expenses (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  business_date  date not null,
  category       text not null,
  name           text not null,
  amount         numeric not null check (amount >= 0),
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Row Level Security（店舗間のデータ漏洩を防ぐ最重要設定）
-- 「自分がstore_membersに登録されている店舗のデータしか見えない」ようにする
-- ============================================================

alter table stores        enable row level security;
alter table store_members enable row level security;
alter table staff         enable row level security;
alter table menu_items    enable row level security;
alter table tabs          enable row level security;
alter table tab_items     enable row level security;
alter table attendance    enable row level security;
alter table expenses      enable row level security;

-- 自分が所属する店舗IDの一覧を返すヘルパー関数
create or replace function my_store_ids()
returns setof uuid
language sql stable
as $$
  select store_id from store_members where user_id = auth.uid();
$$;

-- 各テーブル共通：自分の店舗のデータだけ read/write できる
create policy "users can see their own membership"
  on store_members for select using (user_id = auth.uid());

create policy "store members can access their store"
  on stores for select using (id in (select my_store_ids()));

create policy "store members can access their staff"
  on staff for all using (store_id in (select my_store_ids()));

create policy "store members can access their menu"
  on menu_items for all using (store_id in (select my_store_ids()));

create policy "store members can access their tabs"
  on tabs for all using (store_id in (select my_store_ids()));

create policy "store members can access their tab items"
  on tab_items for all using (
    tab_id in (select id from tabs where store_id in (select my_store_ids()))
  );

create policy "store members can access their attendance"
  on attendance for all using (store_id in (select my_store_ids()));

create policy "store members can access their expenses"
  on expenses for all using (store_id in (select my_store_ids()));

-- ============================================================
-- 初期データ：TEVERを1店舗目として登録
-- ============================================================
insert into stores (name) values ('BAR TEVER');
