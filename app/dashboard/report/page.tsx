"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import {
  Staff,
  Attendance,
  Expense,
  TabWithItems,
  DaySummary,
  businessDateFor,
  tabSubtotal,
  tabTax,
  tabTotal,
  daySummary,
  staffCommissionBreakdown,
} from "@/lib/types";
import { generateInsights } from "@/lib/insights";

type DayRow = { date: string } & DaySummary;

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

export default function ReportPage() {
  const supabase = createClient();
  const { storeId } = useStore();
  const businessDate = businessDateFor(new Date());
  const { start: monthStart, end: monthEnd, label: monthLabel } = monthRange(new Date());

  const [staff, setStaff] = useState<Staff[]>([]);
  const [tabs, setTabs] = useState<TabWithItems[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthRows, setMonthRows] = useState<DayRow[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data: staffData } = await supabase.from("staff").select("*").eq("store_id", storeId);
    setStaff(staffData ?? []);

    const { data: tabsData } = await supabase
      .from("tabs")
      .select("*, tab_items(*)")
      .eq("store_id", storeId)
      .eq("business_date", businessDate);
    setTabs((tabsData as TabWithItems[]) ?? []);

    const { data: attData } = await supabase
      .from("attendance")
      .select("*")
      .eq("store_id", storeId)
      .eq("business_date", businessDate);
    setAttendance(attData ?? []);

    const { data: expData } = await supabase
      .from("expenses")
      .select("*")
      .eq("store_id", storeId)
      .eq("business_date", businessDate);
    setExpenses(expData ?? []);

    const [{ data: monthTabs }, { data: monthAtt }, { data: monthExp }] = await Promise.all([
      supabase
        .from("tabs")
        .select("*, tab_items(*)")
        .eq("store_id", storeId)
        .gte("business_date", monthStart)
        .lte("business_date", monthEnd),
      supabase
        .from("attendance")
        .select("*")
        .eq("store_id", storeId)
        .gte("business_date", monthStart)
        .lte("business_date", monthEnd),
      supabase
        .from("expenses")
        .select("*")
        .eq("store_id", storeId)
        .gte("business_date", monthStart)
        .lte("business_date", monthEnd),
    ]);

    const dates = new Set<string>();
    (monthTabs ?? []).forEach((t: TabWithItems) => dates.add(t.business_date));
    (monthAtt ?? []).forEach((a: Attendance) => dates.add(a.business_date));
    (monthExp ?? []).forEach((e: Expense) => dates.add(e.business_date));

    const staffNameOf = (staffId: string | null) => {
      if (!staffId) return "未設定";
      const s = (staffData ?? []).find((x) => x.id === staffId);
      return s ? s.name : "(元スタッフ)";
    };

    const rows: DayRow[] = Array.from(dates)
      .sort()
      .map((date) => {
        const dTabs = ((monthTabs ?? []) as TabWithItems[]).filter((t) => t.business_date === date);
        const dAtt = ((monthAtt ?? []) as Attendance[]).filter((a) => a.business_date === date);
        const dExp = ((monthExp ?? []) as Expense[]).filter((e) => e.business_date === date);
        return { date, ...daySummary(dTabs, dAtt, dExp, staffNameOf) };
      });
    setMonthRows(rows);
  }, [storeId, businessDate, monthStart, monthEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function staffName(staffId: string | null) {
    if (!staffId) return "未設定";
    const s = staff.find((x) => x.id === staffId);
    return s ? s.name : "(元スタッフ)";
  }

  const summary = daySummary(tabs, attendance, expenses, staffName);
  const commission = staffCommissionBreakdown(tabs, staffName);
  const tabRows = [...tabs].sort(
    (a, b) => Number(!!a.closed_at) - Number(!!b.closed_at) || tabSubtotal(b.tab_items) - tabSubtotal(a.tab_items)
  );
  const insights = generateInsights(summary, tabs, expenses, commission, monthRows);

  const monthTotal = monthRows.reduce(
    (a, r) => ({
      subtotal: a.subtotal + r.subtotal,
      tax: a.tax + r.tax,
      total: a.total + r.total,
      laborHourly: a.laborHourly + r.laborHourly,
      commissionTotal: a.commissionTotal + r.commissionTotal,
      labor: a.labor + r.labor,
      expense: a.expense + r.expense,
      profit: a.profit + r.profit,
      cash: a.cash + r.cash,
      card: a.card + r.card,
      unsettled: a.unsettled + r.unsettled,
    }),
    { subtotal: 0, tax: 0, total: 0, laborHourly: 0, commissionTotal: 0, labor: 0, expense: 0, profit: 0, cash: 0, card: 0, unsettled: 0 }
  );

  async function exportExcel() {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["日報", businessDate],
        [],
        ["小計(税抜)", Math.round(summary.subtotal)],
        ["消費税", Math.round(summary.tax)],
        ["合計(税込)", Math.round(summary.total)],
        ["人件費(時給)", Math.round(summary.laborHourly)],
        ["歩合給", Math.round(summary.commissionTotal)],
        ["人件費合計", Math.round(summary.labor)],
        ["経費", Math.round(summary.expense)],
        ["粗利", Math.round(summary.profit)],
        [],
        ["現金", Math.round(summary.cash)],
        ["カード", Math.round(summary.card)],
        ["未会計", Math.round(summary.unsettled)],
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "日報サマリー");

      const tabSheet = XLSX.utils.json_to_sheet(
        tabRows.map((t) => ({
          伝票名: t.name,
          状態: t.closed_at ? "会計済み" : "対応中",
          会計方法: t.payment_method ?? "",
          来店: new Date(t.created_at).toLocaleTimeString("ja-JP"),
          退店: t.closed_at ? new Date(t.closed_at).toLocaleTimeString("ja-JP") : "",
          品数: t.tab_items.reduce((a, i) => a + i.qty, 0),
          小計: Math.round(tabSubtotal(t.tab_items)),
          消費税: Math.round(tabTax(t.tab_items)),
          合計: Math.round(tabTotal(t.tab_items)),
        }))
      );
      XLSX.utils.book_append_sheet(wb, tabSheet, "伝票別");

      const staffSheet = XLSX.utils.json_to_sheet(
        commission.map((c) => ({
          スタッフ: c.name,
          売上税抜: Math.round(c.salesExTax),
          売上税込: Math.round(c.salesWithTax),
          歩合給: Math.round(c.commission),
        }))
      );
      XLSX.utils.book_append_sheet(wb, staffSheet, "スタッフ別歩合");

      const monthSheet = XLSX.utils.json_to_sheet(
        monthRows
          .map((r) => ({
            日付: r.date,
            小計: Math.round(r.subtotal),
            消費税: Math.round(r.tax),
            合計: Math.round(r.total),
            人件費時給: Math.round(r.laborHourly),
            歩合給: Math.round(r.commissionTotal),
            経費: Math.round(r.expense),
            粗利: Math.round(r.profit),
            現金: Math.round(r.cash),
            カード: Math.round(r.card),
          }))
          .concat([
            {
              日付: "合計",
              小計: Math.round(monthTotal.subtotal),
              消費税: Math.round(monthTotal.tax),
              合計: Math.round(monthTotal.total),
              人件費時給: Math.round(monthTotal.laborHourly),
              歩合給: Math.round(monthTotal.commissionTotal),
              経費: Math.round(monthTotal.expense),
              粗利: Math.round(monthTotal.profit),
              現金: Math.round(monthTotal.cash),
              カード: Math.round(monthTotal.card),
            },
          ])
      );
      XLSX.utils.book_append_sheet(wb, monthSheet, `月次(${monthLabel})`);

      XLSX.writeFile(wb, `BAR_TEVER_${businessDate}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-gold font-bold text-sm">本日サマリー（{businessDate}）</div>
        <button
          onClick={exportExcel}
          disabled={exporting}
          className="text-xs rounded-md bg-gold text-bg px-3 py-1.5 font-bold disabled:opacity-50"
        >
          {exporting ? "出力中..." : "Excel出力"}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-elevated p-3 grid grid-cols-2 gap-y-1 text-sm font-mono">
        <span className="text-gray-400">小計(税抜)</span>
        <span className="text-right">{yen(summary.subtotal)}</span>
        <span className="text-gray-400">消費税</span>
        <span className="text-right">{yen(summary.tax)}</span>
        <span className="text-gray-300 font-bold">合計(税込)</span>
        <span className="text-right text-gold font-bold">{yen(summary.total)}</span>
        <span className="text-gray-400">人件費(時給)</span>
        <span className="text-right">{yen(summary.laborHourly)}</span>
        <span className="text-gray-400">歩合給</span>
        <span className="text-right">{yen(summary.commissionTotal)}</span>
        <span className="text-gray-400">経費</span>
        <span className="text-right">{yen(summary.expense)}</span>
        <span className="text-gray-300 font-bold">粗利</span>
        <span className="text-right text-gold font-bold">{yen(summary.profit)}</span>
        <span className="text-gray-400 mt-2">現金 / カード / 未会計</span>
        <span className="text-right mt-2">
          {yen(summary.cash)} / {yen(summary.card)} / {yen(summary.unsettled)}
        </span>
      </div>

      {insights.length > 0 && (
        <div>
          <div className="text-gold font-bold text-sm mb-2">気づき</div>
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 text-sm">
                <span className="shrink-0">
                  {ins.level === "warning" ? "⚠️" : ins.level === "positive" ? "✅" : "ℹ️"}
                </span>
                <span className="text-gray-300">{ins.text}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ※ ルールベースの自動判定です。あくまで参考情報としてご活用ください
          </div>
        </div>
      )}

      <div>
        <div className="text-gold font-bold text-sm mb-2">伝票別</div>
        {tabRows.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
            本日の伝票はまだありません
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {tabRows.map((t) => (
              <div key={t.id} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-gray-300">
                  {t.closed_at ? (t.payment_method === "cash" ? "💴" : "💳") : "🕐"} {t.name}
                </span>
                <span className="font-mono text-gray-400">{yen(tabTotal(t.tab_items))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">スタッフ別歩合給</div>
        {commission.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
            会計済みの伝票がまだありません
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {commission.map((c) => (
              <div key={c.staffId ?? "unassigned"} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-gray-300">{c.name}</span>
                <span className="font-mono text-gray-400">{yen(c.commission)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">今月サマリー（{monthLabel}）</div>
        <div className="rounded-xl border border-line bg-elevated p-3 grid grid-cols-2 gap-y-1 text-sm font-mono mb-2">
          <span className="text-gray-400">売上合計(税込)</span>
          <span className="text-right">{yen(monthTotal.total)}</span>
          <span className="text-gray-400">人件費合計</span>
          <span className="text-right">{yen(monthTotal.labor)}</span>
          <span className="text-gray-400">経費合計</span>
          <span className="text-right">{yen(monthTotal.expense)}</span>
          <span className="text-gray-300 font-bold">粗利合計</span>
          <span className="text-right text-gold font-bold">{yen(monthTotal.profit)}</span>
        </div>
        {monthRows.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
            今月の記録はまだありません
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {monthRows.map((r) => (
              <div key={r.date} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-gray-300">{r.date}</span>
                <span className="font-mono text-gray-400">
                  {yen(r.total)}（粗利 {yen(r.profit)}）
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
