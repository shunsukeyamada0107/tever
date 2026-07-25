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

export default function OrgDashboardPage() {
  const supabase = createClient();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [stats, setStats] = useState<StoreStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

          const todayTotal = todayTabsTyped
            .filter((t) => t.closed_at)
            .reduce((a, t) => a + tabTotal(t.tab_items, 0.1, t.discount_percent, t.discount_amount), 0);
          const monthTotal = monthTabsTyped
            .filter((t) => t.closed_at)
            .reduce((a, t) => a + tabTotal(t.tab_items, 0.1, t.discount_percent, t.discount_amount), 0);
          const monthExpense = monthExpTyped.reduce((a, e) => a + e.amount, 0);

          const stat: StoreStat = {
            id: store.id,
            name: store.name,
            todayTotal,
            todayTabCount: todayTabsTyped.length,
            monthTotal,
            monthExpense,
          };
          return stat;
        })
      );

      setStats(results);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grandTotal = stats?.reduce(
    (a, s) => ({
      todayTotal: a.todayTotal + s.todayTotal,
      monthTotal: a.monthTotal + s.monthTotal,
      monthExpense: a.monthExpense + s.monthExpense,
    }),
    { todayTotal: 0, monthTotal: 0, monthExpense: 0 }
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
