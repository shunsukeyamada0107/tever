# BAR TEVER アプリ（Next.js + Supabase版）

Claude.aiのアーティファクト版（bar_tever_app.html）を、複数店舗に対応できる
独立したWebアプリとして作り直すためのスタート地点です。

## できていること

- Supabase認証によるログイン画面（`app/login`）
- ログインユーザーの所属店舗を判定する仕組み（`lib/StoreContext.tsx`）
- 営業タブの中核機能（`app/dashboard/page.tsx`）
  - 伝票（お客様・卓）の作成・切り替え
  - 会計済み伝票の分離表示
  - メニューからのワンタップ追加
  - 小計／消費税(10%)／合計の表示
  - 現金／カードでの会計（closed_at・payment_methodの記録）

## まだ実装していないこと（Claude Codeでの続き作業）

- `app/dashboard/staff` — 出退勤、時給人件費、歩合給20%の個人ページ
- `app/dashboard/expenses` — 経費入力
- `app/dashboard/report` — 本日サマリー、伝票別／スタッフ別歩合給、今月サマリー、
  日報・月次管理表のExcel出力
- 伝票の補足欄（memo）の編集UI
- 自由入力での商品追加（品名・金額を都度入力）
- 担当スタッフの選択チップ（tab_items.staff_idへの紐付け）
- メニュー・スタッフの管理画面（設定タブ相当）
- ミドルウェアでの認証ガード（未ログイン時に/loginへ強制的に飛ばす）

計算ロジック自体は `bar_tever_app.html` の中の以下の関数がそのまま参考になります：
`tabSubtotal` / `tabTax` / `tabTotal` / `daySummary` / `staffCommissionBreakdown`

## セットアップ手順

1. このフォルダをClaude Code（またはお使いのエディタ）で開く
2. `npm install`
3. `.env.local.example` を `.env.local` にコピーして、SupabaseプロジェクトのURLと
   anonキーを入力（プロジェクト設定 → API）
4. Supabaseの管理画面 → Authentication → Users から、店舗オーナー用のユーザーを1件作成
5. Supabaseの SQL Editor で、`store_members` テーブルに
   `store_id`（storesテーブルのBAR TEVERの行のid）と、上で作った`user_id`を紐付けるinsertを実行
   ```sql
   insert into store_members (store_id, user_id, role)
   values ('（storesテーブルのid）', '（作成したユーザーのid）', 'owner');
   ```
6. `npm run dev` でローカル起動して `http://localhost:3000` を確認
7. 動作確認できたら、Vercelにデプロイ（GitHubリポジトリ経由が簡単です）

## 進め方の目安

このスタート地点をClaude Codeに渡して、「staff/expenses/reportページを
bar_tever_app.htmlの機能を参考に実装して」と依頼するところから続けるのがおすすめです。
