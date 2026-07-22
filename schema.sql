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
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,                 -- 例: "BAR TEVER"
  plan                      text not null default 'trial' check (plan in ('trial','paid','suspended')),
  tax_rate                  numeric not null default 0.10,  -- 消費税率（0.10=10%）
  commission_rate           numeric not null default 0.20,  -- 歩合率（0.20=20%）
  business_day_cutoff_hour  integer not null default 6,      -- 営業日の切り替え時刻（この時刻より前は前日扱い）
  report_template           text,                            -- LINE報告レポートの自由テンプレート（未設定ならアプリ側の既定形式を使う）
  created_at                timestamptz not null default now()
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
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  name            text not null,
  price           numeric not null check (price >= 0),
  course_minutes  integer,           -- 飲み放題等コースの場合の時間（分）。null=通常メニュー
  active          boolean not null default true,
  created_at      timestamptz not null default now()
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
  guest_count     integer,                             -- 人数（任意）
  course_ends_at  timestamptz,                          -- 飲み放題等コースの終了予定時刻（任意）
  discount_percent numeric,                             -- 割引率（例: 30 = 30%OFF、任意）
  discount_amount  numeric,                             -- 自由入力の値引き額（円、任意）
  staff_id        uuid references staff(id) on delete set null, -- この伝票の担当スタッフ（歩合給の対象）
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
  receipt_url    text,          -- 撮影したレシート画像のURL（任意）
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

create policy "store owners can update their store"
  on stores for update using (
    id in (select store_id from store_members where user_id = auth.uid() and role = 'owner')
  );

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
-- Storage（レシート画像の保存先）
-- receiptsバケットを作成し、ログイン済みユーザーのアップロードを許可する
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "authenticated users can upload receipts"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts');

create policy "authenticated users can delete their receipts"
  on storage.objects for delete to authenticated
  using (bucket_id = 'receipts');

-- ============================================================
-- インデックス（店舗数・データ量が増えても検索を高速に保つため）
-- ============================================================

-- my_store_ids()が全RLSポリシーの起点になるため、これが最重要
create index if not exists idx_store_members_user_id on store_members(user_id);

create index if not exists idx_staff_store_id on staff(store_id);
create index if not exists idx_menu_items_store_id on menu_items(store_id);

create index if not exists idx_tabs_store_business_date on tabs(store_id, business_date);
create index if not exists idx_attendance_store_business_date on attendance(store_id, business_date);
create index if not exists idx_expenses_store_business_date on expenses(store_id, business_date);

-- tab_itemsはstore_idを持たないため、tabs経由のRLS/joinを速くする
create index if not exists idx_tab_items_tab_id on tab_items(tab_id);

-- ============================================================
-- 自己サインアップ：新規ユーザー登録時に自動で店舗を作成
-- auth.usersにレコードが作られたタイミングで発火し、
-- サインアップ時に渡したstore_nameでstoresを作成、そのユーザーをownerとして紐付ける
-- ============================================================
create or replace function handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_store_id uuid;
begin
  insert into stores (name)
  values (coalesce(new.raw_user_meta_data->>'store_name', '新しい店舗'))
  returning id into new_store_id;

  insert into store_members (store_id, user_id, role)
  values (new_store_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_signup();

-- ============================================================
-- 初期データ：TEVERを1店舗目として登録
-- ============================================================
insert into stores (name) values ('BAR TEVER');
