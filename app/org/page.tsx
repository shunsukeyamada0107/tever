"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { TabWithItems, Expense, tabTotal, businessDateFor, DEFAULT_BUSINESS_DAY_CUTOFF_HOUR } from "@/lib/types";

type StoreStat = {
  id: string;
  name: string;
  todayTotal: number;
  todayTabCount: number;
  monthTotal: number;
  monthExpense: number;
  liveGroupCount: number;
  liveGuestCount: number;
  livePreCheckoutTotal: number;
};

function yen(n: number) {
  return `¥${Math.round(n).toLocaleString()}`;
}

function monthRange(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { start, end, label: `${year}年${month + 1}月` };
}

const LIVE_REFRESH_MS = 15000;

export default function OrgDashboardPage() {
  const supabase = createClient();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [stats, setStats] = useState<StoreStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const { start: monthStart, end: monthEnd, label: monthLabel } = monthRange(new Date());

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("ログインが必要です。");
        return;
      }

      const { data: membership, error: memErr } = await supabase
        .from("organization_members")
        .select("organization_id, organizations(name)")
        .eq("user_id", userData.user.id)
        .limit(1)
        .single();

      if (memErr || !membership) {
        setError("組織が見つかりませんでした。運営にお問い合わせください。");
        return;
      }

      type OrgRow = { name: string };
      const orgs = membership.organizations as unknown as OrgRow | OrgRow[] | null;
      const org = Array.isArray(orgs) ? orgs[0] : orgs;
      setOrgName(org?.name ?? "組織");

      const { data: storesData, error: storesErr } = await supabase
        .from("stores")
        .select("id, name, business_day_cutoff_hour")
        .eq("organization_id", membership.organization_id)
        .order("name", { ascending: true });

      if (storesErr || !storesData) {
        setError("店舗情報の取得に失敗しました。");
        return;
      }

      const results = await Promise.all(
        storesData.map(async (store) => {
          const cutoffHour = store.business_day_cutoff_hour ?? DEFAULT_BUSINESS_DAY_CUTOFF_HOUR;
          const todayStr = businessDateFor(new Date(), cutoffHour);

          const [{ data: todayTabs }, { data: monthTabs }, { data: monthExp }] = await Promise.all([
            supabase.from("tabs").select("*, tab_items(*)").eq("store_id", store.id).eq("business_date", todayStr),
            supabase
              .from("tabs")
              .select("*, tab_items(*)")
              .eq("store_id", store.id)
              .gte("business_date", monthStart)
              .lte("business_date", monthEnd),
            supabase
              .from("expenses")
              .select("amount")
              .eq("store_id", store.id)
              .gte("business_date", monthStart)
              .lte("business_date", monthEnd),
          ]);

          const todayTabsTyped = (todayTabs as TabWithItems[]) ?? [];
          const monthTabsTyped = (monthTabs as TabWithItems[]) ?? [];
          const monthExpTyped = (monthExp as Pick<Expense, "amount">[]) ?? [];

          const openTabs = todayTabsTyped.filter((t) => !t.closed_at);
          const closedTabs = todayTabsTyped.filter((t) => t.closed_at);

          const todayTotal = closedTabs.reduce(
            (a, t) => a + tabTotal(t.tab_items, 0.1, t.discount_percent, t.discount_amount),
            0
          );
          const monthTotal = monthTabsTyped
            .filter((t) => t.closed_at)
            .reduce((a, t) => a + tabTotal(t.tab_items, 0.1, t.discount_percent, t.discount_amount), 0);
          const monthExpense = monthExpTyped.reduce((a, e) => a + e.amount, 0);

          const liveGroupCount = openTabs.length;
          const liveGuestCount = openTabs.reduce((a, t) => a + (t.guest_count ?? 0), 0);
          const livePreCheckoutTotal = openTabs.reduce(
            (a, t) => a + tabTotal(t.tab_items, 0.1, t.discount_percent, t.discount_amount),
            0
          );

          const stat: StoreStat = {
            id: store.id,
            name: store.name,
            todayTotal,
            todayTabCount: closedTabs.length,
            monthTotal,
            monthExpense,
            liveGroupCount,
            liveGuestCount,
            livePreCheckoutTotal,
          };
          return stat;
        })
      );

      setStats(results);
      setLastUpdatedAt(new Date());
    }
    load();
    const refreshTimer = setInterval(load, LIVE_REFRESH_MS);
    return () => clearInterval(refreshTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000));
    tick();
    const tickTimer = setInterval(tick, 1000);
    return () => clearInterval(tickTimer);
  }, [lastUpdatedAt]);

  const grandTotal = stats?.reduce(
    (a, s) => ({
      todayTotal: a.todayTotal + s.todayTotal,
      monthTotal: a.monthTotal + s.monthTotal,
      monthExpense: a.monthExpense + s.monthExpense,
      liveGroupCount: a.liveGroupCount + s.liveGroupCount,
      liveGuestCount: a.liveGuestCount + s.liveGuestCount,
      livePreCheckoutTotal: a.livePreCheckoutTotal + s.livePreCheckoutTotal,
    }),
    { todayTotal: 0, monthTotal: 0, monthExpense: 0, liveGroupCount: 0, liveGuestCount: 0, livePreCheckoutTotal: 0 }
  );

  if (error) {
    return <div className="text-sm text-rose text-center py-10">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-gold font-bold text-lg">{orgName ?? "読み込み中..."}</div>

      {!stats ? (
        <div className="text-sm text-gray-500 text-center py-10">読み込み中...</div>
      ) : stats.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-10 border border-dashed border-line rounded-xl">
          所属する店舗がまだありません。
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gold font-bold text-sm">いまの状況</span>
              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-400" />
                </span>
                ライブ
              </span>
              <span className="text-gray-500 text-xs ml-auto">
                更新: {secondsAgo < 3 ? "たった今" : `${secondsAgo}秒前`}
              </span>
            </div>
            <div className="rounded-xl border border-line bg-elevated p-4 grid grid-cols-2 gap-y-1 text-sm font-mono mb-2">
              <span className="text-gray-300 font-bold">いま入店中</span>
              <span className="text-right font-bold text-base">
                {grandTotal?.liveGuestCount ?? 0}名
                <span className="text-gray-500 font-normal text-xs ml-1">
                  （{grandTotal?.liveGroupCount ?? 0}組）
                </span>
              </span>
              <span className="text-gray-400 mt-2">会計前の売上</span>
              <span className="text-right text-green-400 font-bold mt-2">
                {yen(grandTotal?.livePreCheckoutTotal ?? 0)}
              </span>
            </div>
            <div className="space-y-2">
              {stats
                .slice()
                .sort((a, b) => b.liveGuestCount - a.liveGuestCount)
                .map((s) => (
                  <div key={s.id} className="rounded-xl border border-line bg-elevated p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            s.liveGroupCount > 0 ? "bg-green-400 animate-pulse" : "bg-gray-600"
                          }`}
                        />
                        <span className="font-bold">{s.name}</span>
                      </div>
                      <span className="text-green-400 font-bold font-mono">{yen(s.livePreCheckoutTotal)}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {s.liveGroupCount}組 / {s.liveGuestCount}名
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-line border-l-4 border-l-gold bg-elevated p-4 grid grid-cols-2 gap-y-1 text-sm font-mono">
            <span className="text-gray-300 font-bold">全店舗・本日の売上合計</span>
            <span className="text-right text-gold font-bold text-base">{yen(grandTotal?.todayTotal ?? 0)}</span>
            <span className="text-gray-400 mt-2">全店舗・{monthLabel}の売上合計</span>
            <span className="text-right mt-2">{yen(grandTotal?.monthTotal ?? 0)}</span>
            <span className="text-gray-400">全店舗・{monthLabel}の経費合計</span>
            <span className="text-right">{yen(grandTotal?.monthExpense ?? 0)}</span>
          </div>

          <div>
            <div className="text-gold font-bold text-sm mb-2">店舗別</div>
            <div className="space-y-2">
              {stats
                .slice()
                .sort((a, b) => b.monthTotal - a.monthTotal)
                .map((s) => (
                  <div key={s.id} className="rounded-xl border border-line bg-elevated p-3 text-sm">
                    <div className="font-bold mb-1">{s.name}</div>
                    <div className="grid grid-cols-2 gap-y-0.5 font-mono text-xs">
                      <span className="text-gray-400">本日の売上（{s.todayTabCount}組）</span>
                      <span className="text-right text-gold font-bold">{yen(s.todayTotal)}</span>
                      <span className="text-gray-400">{monthLabel}の売上</span>
                      <span className="text-right">{yen(s.monthTotal)}</span>
                      <span className="text-gray-400">{monthLabel}の経費</span>
                      <span className="text-right">{yen(s.monthExpense)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
