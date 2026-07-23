"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import { useBusinessDate } from "@/lib/BusinessDateContext";
import { DateBar } from "@/lib/DateBar";
import {
  Staff,
  Attendance,
  Expense,
  TabWithItems,
  DaySummary,
  tabSubtotal,
  tabTax,
  tabTotal,
  daySummary,
  staffCommissionBreakdown,
  hourlyLaborBreakdown,
} from "@/lib/types";
import { generateInsights } from "@/lib/insights";
import { MonthlySalesChart, ChartPoint } from "@/lib/MonthlySalesChart";
import { DEFAULT_REPORT_TEMPLATE, renderReportTemplate } from "@/lib/reportTemplate";

type DayRow = { date: string; tabCount: number; guestCount: number } & DaySummary;

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

function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((now - prev) / prev) * 100;
}

export default function ReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const {
    storeId,
    storeName,
    taxRate,
    commissionRate,
    reportTemplate,
    cashFloatAmount,
    commissionScheme,
    drinkBackAmount,
    showInsights,
  } = useStore();
  const { date: businessDate, isToday } = useBusinessDate();
  const { start: monthStart, end: monthEnd, label: monthLabel } = monthRange(new Date(`${businessDate}T12:00:00`));
  const prevMonthAnchor = new Date(`${monthStart}T12:00:00`);
  prevMonthAnchor.setMonth(prevMonthAnchor.getMonth() - 1);
  const { start: prevMonthStart, end: prevMonthEnd, label: prevMonthLabel } = monthRange(prevMonthAnchor);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [tabs, setTabs] = useState<TabWithItems[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthRows, setMonthRows] = useState<DayRow[]>([]);
  const [monthTabsRaw, setMonthTabsRaw] = useState<TabWithItems[]>([]);
  const [monthAttRaw, setMonthAttRaw] = useState<Attendance[]>([]);
  const [monthExpRaw, setMonthExpRaw] = useState<Expense[]>([]);
  const [exporting, setExporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copyLabel, setCopyLabel] = useState("コピーする");
  const [showChart, setShowChart] = useState(false);
  const [selectedChartDate, setSelectedChartDate] = useState<string | null>(null);
  const [showCostChart, setShowCostChart] = useState(false);
  const [selectedCostDate, setSelectedCostDate] = useState<string | null>(null);
  const [prevMonthSummary, setPrevMonthSummary] = useState<DaySummary | null>(null);

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

    const [
      { data: monthTabs },
      { data: monthAtt },
      { data: monthExp },
      { data: prevTabs },
      { data: prevAtt },
      { data: prevExp },
    ] = await Promise.all([
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
      supabase
        .from("tabs")
        .select("*, tab_items(*)")
        .eq("store_id", storeId)
        .gte("business_date", prevMonthStart)
        .lte("business_date", prevMonthEnd),
      supabase
        .from("attendance")
        .select("*")
        .eq("store_id", storeId)
        .gte("business_date", prevMonthStart)
        .lte("business_date", prevMonthEnd),
      supabase
        .from("expenses")
        .select("*")
        .eq("store_id", storeId)
        .gte("business_date", prevMonthStart)
        .lte("business_date", prevMonthEnd),
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
    const isEligibleOf = (staffId: string) => (staffData ?? []).find((x) => x.id === staffId)?.commission_eligible ?? true;

    const rows: DayRow[] = Array.from(dates)
      .sort()
      .map((date) => {
        const dTabs = ((monthTabs ?? []) as TabWithItems[]).filter((t) => t.business_date === date);
        const dAtt = ((monthAtt ?? []) as Attendance[]).filter((a) => a.business_date === date);
        const dExp = ((monthExp ?? []) as Expense[]).filter((e) => e.business_date === date);
        const tabCount = dTabs.length;
        const guestCount = dTabs.reduce((a, t) => a + (t.guest_count ?? 0), 0);
        return {
          date,
          tabCount,
          guestCount,
          ...daySummary(
            dTabs,
            dAtt,
            dExp,
            staffNameOf,
            taxRate,
            commissionRate,
            commissionScheme,
            drinkBackAmount,
            isEligibleOf
          ),
        };
      });
    setMonthRows(rows);
    setMonthTabsRaw((monthTabs as TabWithItems[]) ?? []);
    setMonthAttRaw((monthAtt as Attendance[]) ?? []);
    setMonthExpRaw((monthExp as Expense[]) ?? []);
    setPrevMonthSummary(
      daySummary(
        (prevTabs as TabWithItems[]) ?? [],
        (prevAtt as Attendance[]) ?? [],
        (prevExp as Expense[]) ?? [],
        staffNameOf,
        taxRate,
        commissionRate,
        commissionScheme,
        drinkBackAmount,
        isEligibleOf
      )
    );
  }, [
    storeId,
    businessDate,
    monthStart,
    monthEnd,
    prevMonthStart,
    prevMonthEnd,
    taxRate,
    commissionRate,
    commissionScheme,
    drinkBackAmount,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function staffName(staffId: string | null) {
    if (!staffId) return "未設定";
    const s = staff.find((x) => x.id === staffId);
    return s ? s.name : "(元スタッフ)";
  }

  function isEligible(staffId: string) {
    return staff.find((x) => x.id === staffId)?.commission_eligible ?? true;
  }

  const summary = daySummary(
    tabs,
    attendance,
    expenses,
    staffName,
    taxRate,
    commissionRate,
    commissionScheme,
    drinkBackAmount,
    isEligible
  );
  const commission = staffCommissionBreakdown(
    tabs,
    staffName,
    taxRate,
    commissionRate,
    commissionScheme,
    drinkBackAmount,
    isEligible
  );
  const hourlyLabor = hourlyLaborBreakdown(attendance, staffName);
  const tabRows = [...tabs].sort(
    (a, b) => Number(!!a.closed_at) - Number(!!b.closed_at) || tabSubtotal(b.tab_items) - tabSubtotal(a.tab_items)
  );
  const insights = generateInsights(summary, tabs, expenses, commission, monthRows);

  const monthTotal = monthRows.reduce(
    (a, r) => ({
      subtotal: a.subtotal + r.subtotal,
      tax: a.tax + r.tax,
      roundingAdjustment: a.roundingAdjustment + r.roundingAdjustment,
      total: a.total + r.total,
      laborHourly: a.laborHourly + r.laborHourly,
      commissionTotal: a.commissionTotal + r.commissionTotal,
      labor: a.labor + r.labor,
      expense: a.expense + r.expense,
      profit: a.profit + r.profit,
      cash: a.cash + r.cash,
      card: a.card + r.card,
      unsettled: a.unsettled + r.unsettled,
      tabCount: a.tabCount + r.tabCount,
      guestCount: a.guestCount + r.guestCount,
    }),
    {
      subtotal: 0,
      tax: 0,
      roundingAdjustment: 0,
      total: 0,
      laborHourly: 0,
      commissionTotal: 0,
      labor: 0,
      expense: 0,
      profit: 0,
      cash: 0,
      card: 0,
      unsettled: 0,
      tabCount: 0,
      guestCount: 0,
    }
  );

  // 月間売上グラフ用：その月の1日〜末日まで欠けなく並べる（記録が無い日は0）
  function buildChartSeries(): ChartPoint[] {
    const [monthYear, monthNum] = monthStart.split("-").map(Number);
    const daysInMonth = new Date(monthYear, monthNum, 0).getDate();
    const rowByDate = new Map(monthRows.map((r) => [r.date, r]));
    const series: ChartPoint[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${monthStart.slice(0, 8)}${String(day).padStart(2, "0")}`;
      series.push({ day, date, total: rowByDate.get(date)?.total ?? 0 });
    }
    return series;
  }
  const chartSeries = buildChartSeries();
  const selectedChartRow = selectedChartDate ? monthRows.find((r) => r.date === selectedChartDate) : null;

  // 原価（経費）グラフ用：日ごとの経費合計
  function buildCostSeries(): ChartPoint[] {
    const [monthYear, monthNum] = monthStart.split("-").map(Number);
    const daysInMonth = new Date(monthYear, monthNum, 0).getDate();
    const rowByDate = new Map(monthRows.map((r) => [r.date, r]));
    const series: ChartPoint[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${monthStart.slice(0, 8)}${String(day).padStart(2, "0")}`;
      series.push({ day, date, total: rowByDate.get(date)?.expense ?? 0 });
    }
    return series;
  }
  const costSeries = buildCostSeries();
  const selectedCostReceipts = selectedCostDate
    ? monthExpRaw.filter((e) => e.business_date === selectedCostDate && e.receipt_url)
    : [];

  function buildReportText() {
    const [, m, d] = businessDate.split("-").map(Number);
    const [, monM] = monthStart.split("-").map(Number);

    const coupon50Today = tabRows.filter((t) => t.discount_percent === 50).length;
    const coupon50Month = monthTabsRaw.filter((t) => t.discount_percent === 50).length;

    const monthCommission = staffCommissionBreakdown(
      monthTabsRaw,
      staffName,
      taxRate,
      commissionRate,
      commissionScheme,
      drinkBackAmount,
      isEligible
    );
    const monthHourlyLabor = hourlyLaborBreakdown(monthAttRaw, staffName);
    const monthUnsettled = monthTabsRaw.filter((t) => !t.closed_at);

    const tokens: Record<string, string> = {
      date: `${m}/${d}`,
      sales: yen(summary.total),
      expense: yen(summary.expense),
      profit: yen(summary.profit),
      card: yen(summary.card),
      tab_count: String(tabRows.length),
      guest_count: String(tabs.reduce((a, t) => a + (t.guest_count ?? 0), 0)),
      coupon50: String(coupon50Today),
      hourly_hours:
        hourlyLabor.length > 0 ? hourlyLabor.map((h) => `${h.name} ${h.hours.toFixed(1)}h`).join("\n") : "　",
      hourly_cost: hourlyLabor.length > 0 ? hourlyLabor.map((h) => `${h.name} ${yen(h.cost)}`).join("\n") : "　",
      commission:
        commission.length > 0
          ? commission.map((c) => `${c.name} ${yen(c.commission)}（${yen(c.salesWithTax)}）`).join("\n")
          : "　",
      month_range: `${monM}/1〜${m}/${d}`,
      month_num: String(m),
      month_sales: yen(monthTotal.total),
      month_expense: yen(monthTotal.expense),
      month_profit: yen(monthTotal.profit),
      month_card: yen(monthTotal.card),
      month_tab_count: String(monthTotal.tabCount),
      month_guest_count: String(monthTotal.guestCount),
      month_coupon50: String(coupon50Month),
      month_hourly:
        monthHourlyLabor.length > 0
          ? monthHourlyLabor.map((h) => `${h.name}  ${h.hours.toFixed(1)}h${yen(h.cost)}`).join("\n")
          : "　",
      month_commission:
        monthCommission.length > 0
          ? monthCommission.map((c) => `${c.name}${yen(c.commission)}（${yen(c.salesWithTax)}）`).join("\n")
          : "　",
      month_unsettled:
        monthUnsettled.length > 0
          ? monthUnsettled
              .map((t) => `${t.name}${yen(tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount))}`)
              .join("\n")
          : "　",
    };

    return renderReportTemplate(reportTemplate ?? DEFAULT_REPORT_TEMPLATE, tokens);
  }

  async function copyReportText() {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopyLabel("コピーしました！");
      setTimeout(() => setCopyLabel("コピーする"), 2000);
    } catch {
      setCopyLabel("コピーできませんでした");
      setTimeout(() => setCopyLabel("コピーする"), 2000);
    }
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();

      const GOLD = "FFDCA84E";
      const DARK = "FF11142A";
      const BAND = "FFE0F7FA";
      const ROSE = "FFCE5468";
      const BORDER: import("exceljs").Border = { style: "thin", color: { argb: "FFDDDDDD" } };

      const styleHeaderRow = (row: import("exceljs").Row) => {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
          cell.font = { bold: true, color: { argb: DARK } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
        });
      };

      const styleDataRow = (row: import("exceljs").Row, banded: boolean) => {
        row.eachCell((cell) => {
          if (banded) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BAND } };
          cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
        });
      };

      // --- 日報サマリー ---
      const summarySheet = wb.addWorksheet("日報サマリー");
      summarySheet.columns = [{ width: 18 }, { width: 16 }];
      const titleRow = summarySheet.addRow(["日報", businessDate]);
      titleRow.font = { bold: true, size: 13, color: { argb: GOLD } };
      summarySheet.addRow([]);
      const summaryData: [string, number][] = [
        ["小計(税抜)", Math.round(summary.subtotal)],
        ["消費税", Math.round(summary.tax)],
        ["合計(税込)", Math.round(summary.total)],
        ["人件費（歩合給+時給）", Math.round(summary.labor)],
        ["経費", Math.round(summary.expense)],
        ["粗利", Math.round(summary.profit)],
      ];
      summaryData.forEach(([label, value]) => {
        const row = summarySheet.addRow([label, value]);
        row.getCell(2).numFmt = '"¥"#,##0';
        if (label === "粗利") row.font = { bold: true, color: { argb: GOLD } };
      });
      summarySheet.addRow([]);
      [
        ["現金", Math.round(summary.cash)],
        ["カード", Math.round(summary.card)],
        ["未会計", Math.round(summary.unsettled)],
      ].forEach(([label, value]) => {
        const row = summarySheet.addRow([label, value]);
        row.getCell(2).numFmt = '"¥"#,##0';
      });

      // --- 伝票別 ---
      const tabSheet = wb.addWorksheet("伝票別");
      tabSheet.columns = [
        { header: "伝票名", key: "name", width: 16 },
        { header: "担当スタッフ", key: "staff", width: 14 },
        { header: "状態", key: "status", width: 10 },
        { header: "会計方法", key: "method", width: 10 },
        { header: "来店", key: "in", width: 10 },
        { header: "退店", key: "out", width: 10 },
        { header: "品数", key: "count", width: 8 },
        { header: "小計", key: "subtotal", width: 12 },
        { header: "消費税", key: "tax", width: 12 },
        { header: "合計", key: "total", width: 12 },
      ];
      styleHeaderRow(tabSheet.getRow(1));
      tabRows.forEach((t, i) => {
        const row = tabSheet.addRow({
          name: t.name,
          staff: staffName(t.staff_id),
          status: t.closed_at ? "会計済み" : "対応中",
          method: t.payment_method ?? "",
          in: new Date(t.created_at).toLocaleTimeString("ja-JP"),
          out: t.closed_at ? new Date(t.closed_at).toLocaleTimeString("ja-JP") : "",
          count: t.tab_items.reduce((a, x) => a + x.qty, 0),
          subtotal: Math.round(tabSubtotal(t.tab_items)),
          tax: Math.round(tabTax(t.tab_items, taxRate, t.discount_percent, t.discount_amount)),
          total: Math.round(tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount)),
        });
        row.getCell("subtotal").numFmt = '"¥"#,##0';
        row.getCell("tax").numFmt = '"¥"#,##0';
        row.getCell("total").numFmt = '"¥"#,##0';
        styleDataRow(row, i % 2 === 1);
      });

      // --- スタッフ別歩合 ---
      const staffSheet = wb.addWorksheet("スタッフ別歩合");
      staffSheet.columns = [
        { header: "スタッフ", key: "name", width: 14 },
        { header: "売上税抜", key: "exTax", width: 14 },
        { header: "売上税込", key: "withTax", width: 14 },
        { header: "歩合給", key: "commission", width: 14 },
      ];
      styleHeaderRow(staffSheet.getRow(1));
      commission.forEach((c, i) => {
        const row = staffSheet.addRow({
          name: c.name,
          exTax: Math.round(c.salesExTax),
          withTax: Math.round(c.salesWithTax),
          commission: Math.round(c.commission),
        });
        ["exTax", "withTax", "commission"].forEach((k) => (row.getCell(k).numFmt = '"¥"#,##0'));
        row.getCell("commission").font = { bold: true, color: { argb: GOLD } };
        styleDataRow(row, i % 2 === 1);
      });

      // --- 時給人件費 ---
      if (hourlyLabor.length > 0) {
        const hourlySheet = wb.addWorksheet("時給人件費");
        hourlySheet.columns = [
          { header: "スタッフ", key: "name", width: 14 },
          { header: "勤務時間", key: "hours", width: 12 },
          { header: "人件費", key: "cost", width: 14 },
        ];
        styleHeaderRow(hourlySheet.getRow(1));
        hourlyLabor.forEach((h, i) => {
          const row = hourlySheet.addRow({ name: h.name, hours: Number(h.hours.toFixed(1)), cost: Math.round(h.cost) });
          row.getCell("cost").numFmt = '"¥"#,##0';
          styleDataRow(row, i % 2 === 1);
        });
      }

      // --- 月の売上管理表：日ごとの売上高・原価・粗利益・組数・人数（月内の全日を1〜末日まで表示） ---
      const [monthYear, monthNum] = monthStart.split("-").map(Number);
      const daysInMonth = new Date(monthYear, monthNum, 0).getDate();
      const rowByDate = new Map(monthRows.map((r) => [r.date, r]));

      const monthSheet = wb.addWorksheet(`月次(${monthLabel})`);
      monthSheet.columns = [
        { width: 8 },
        { width: 13 },
        { width: 13 },
        { width: 13 },
        { width: 10 },
        { width: 10 },
      ];
      const titleRow2 = monthSheet.addRow(["月", storeName ?? ""]);
      titleRow2.font = { bold: true, size: 13, color: { argb: GOLD } };
      styleHeaderRow(monthSheet.addRow(["日", "売上高", "原価", "粗利益", "組数", "人数"]));

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${monthStart.slice(0, 8)}${String(day).padStart(2, "0")}`;
        const r = rowByDate.get(date);
        const sales = r ? Math.round(r.subtotal) : 0;
        const cost = r ? Math.round(r.expense) : 0;
        const row = monthSheet.addRow([day, sales, cost, sales - cost, r?.tabCount ?? 0, r?.guestCount ?? 0]);
        [2, 3, 4].forEach((c) => (row.getCell(c).numFmt = '"¥"#,##0'));
        styleDataRow(row, day % 2 === 0);
      }
      const ledgerTotalSales = Math.round(monthTotal.subtotal);
      const ledgerTotalCost = Math.round(monthTotal.expense);
      const totalRow = monthSheet.addRow([
        "合計",
        ledgerTotalSales,
        ledgerTotalCost,
        ledgerTotalSales - ledgerTotalCost,
        monthTotal.tabCount,
        monthTotal.guestCount,
      ]);
      totalRow.font = { bold: true };
      totalRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
        cell.font = { bold: true, color: { argb: DARK } };
      });
      [2, 3, 4].forEach((c) => (totalRow.getCell(c).numFmt = '"¥"#,##0'));

      if (prevMonthSummary) {
        monthSheet.addRow([]);
        const cmpHeader = monthSheet.addRow([`${prevMonthLabel}比`, "今月", "先月", "増減%"]);
        cmpHeader.font = { bold: true };
        (
          [
            ["売上(税込)", monthTotal.total, prevMonthSummary.total],
            ["経費", monthTotal.expense, prevMonthSummary.expense],
            ["粗利", monthTotal.profit, prevMonthSummary.profit],
          ] as const
        ).forEach(([label, now, prev]) => {
          const change = pctChange(now, prev);
          const row = monthSheet.addRow([label, Math.round(now), Math.round(prev), change != null ? Math.round(change) : ""]);
          row.getCell(2).numFmt = '"¥"#,##0';
          row.getCell(3).numFmt = '"¥"#,##0';
          if (change != null) row.getCell(4).font = { color: { argb: change >= 0 ? GOLD : ROSE } };
        });
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `YourManager_${businessDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <DateBar />
      <div className="flex justify-between items-center">
        <div className="text-gold font-bold text-sm">📅 {isToday ? "本日" : businessDate}の売上</div>
        <button
          onClick={exportExcel}
          disabled={exporting}
          className="text-xs rounded-md bg-gold text-bg px-3 py-1.5 font-bold disabled:opacity-50"
        >
          {exporting ? "出力中..." : "Excel出力"}
        </button>
      </div>

      <div className="rounded-xl border border-line border-l-4 border-l-gold bg-elevated p-3 grid grid-cols-2 gap-y-1 text-sm font-mono">
        <span className="text-gray-300 font-bold">総合売上（税込）</span>
        <span className="text-right text-gold font-bold">{yen(summary.total)}</span>
        <span className="col-span-2 text-right text-xs text-gray-500 -mt-0.5">（消費税 {yen(summary.tax)}）</span>
        <span className="text-gray-400 mt-2">人件費（歩合給+時給）</span>
        <span className="text-right mt-2">{yen(summary.labor)}</span>
        <span className="text-gray-400">経費</span>
        <span className="text-right">{yen(summary.expense)}</span>
        <span className="text-gray-300 font-bold">粗利</span>
        <span className="text-right text-gold font-bold">{yen(summary.profit)}</span>
        <span className="text-gray-400 mt-2">現金 / カード / 未会計</span>
        <span className="text-right mt-2">
          {yen(summary.cash)} / {yen(summary.card)} / {yen(summary.unsettled)}
        </span>
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">現金精算</div>
        <div className="rounded-xl border border-line bg-elevated p-3 grid grid-cols-2 gap-y-1 text-sm font-mono">
          <span className="text-gray-400">現金売上</span>
          <span className="text-right">{yen(summary.cash)}</span>
          <span className="text-gray-400">経費（現金支払い分）</span>
          <span className="text-right">−{yen(summary.expense)}</span>
          <span className="text-gray-300 font-bold">封筒に入れる現金</span>
          <span className="text-right text-gold font-bold">{yen(summary.cash - summary.expense)}</span>
          <span className="text-gray-400 mt-2">金庫に残す現金（釣り銭元金）</span>
          <span className="text-right mt-2">{yen(cashFloatAmount)}</span>
          <span className="text-gray-400">レジにあるはずの現金合計</span>
          <span className="text-right">{yen(summary.cash - summary.expense + cashFloatAmount)}</span>
        </div>
      </div>

      {hourlyLabor.length > 0 && (
        <div>
          <div className="text-gold font-bold text-sm mb-2">時給人件費（時給設定スタッフのみ）</div>
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {hourlyLabor.map((h) => (
              <div key={h.staffId} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-gray-300">
                  {h.name}
                  <span className="text-xs text-gray-500"> ・{h.hours.toFixed(1)}h</span>
                </span>
                <span className="font-mono text-gray-400">{yen(h.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInsights && insights.length > 0 && (
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
              <button
                key={t.id}
                onClick={() => router.push(`/dashboard?tab=${t.id}`)}
                className="w-full flex justify-between items-center px-3 py-2 text-sm text-left active:bg-bg2"
              >
                <span className="text-gray-300">
                  {t.closed_at ? (t.payment_method === "cash" ? "💴" : "💳") : "🕐"} {t.name}
                  <span className="text-xs text-gray-500"> ・👤{staffName(t.staff_id)}</span>
                </span>
                <span className="font-mono text-gray-400">{yen(tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount))}</span>
              </button>
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
              <div key={c.staffId ?? "unassigned"} className="px-3 py-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{c.name}</span>
                  <span className="font-mono text-gray-400">
                    {yen(c.commission)}
                    <span className="text-gray-500"> （{yen(c.salesWithTax)}）</span>
                  </span>
                </div>
                {commissionScheme === "drink_back" && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    売上バック {yen(c.salesBack)} ・ 🍾ドリンクバック {yen(c.drinkBack)}（{c.drinkCount}杯）
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[#6FB3E0] font-bold text-sm mb-2">🗓️ 今月サマリー（{monthLabel}）</div>
        <div className="rounded-xl border border-line border-l-4 border-l-[#6FB3E0] bg-elevated p-3 grid grid-cols-2 gap-y-1 text-sm font-mono mb-2">
          <span className="text-gray-300 font-bold">総合売上（税込）</span>
          <span className="text-right text-[#6FB3E0] font-bold">{yen(monthTotal.total)}</span>
          <span className="col-span-2 text-right text-xs text-gray-500 -mt-0.5">（消費税 {yen(monthTotal.tax)}）</span>
          <span className="text-gray-400 mt-2">人件費合計（歩合給+時給）</span>
          <span className="text-right mt-2">{yen(monthTotal.labor)}</span>
          <span className="text-gray-400">経費合計</span>
          <span className="text-right">{yen(monthTotal.expense)}</span>
          <span className="text-gray-300 font-bold">粗利合計</span>
          <span className="text-right text-[#6FB3E0] font-bold">{yen(monthTotal.profit)}</span>
        </div>

        {prevMonthSummary && (
          <div className="rounded-xl border border-line border-l-4 border-l-[#6FB3E0] bg-elevated p-3 mb-2">
            <div className="text-xs text-gray-500 mb-2">{prevMonthLabel}との比較</div>
            <div className="grid grid-cols-2 gap-y-1 text-sm font-mono">
              {(
                [
                  ["売上(税込)", monthTotal.total, prevMonthSummary.total],
                  ["経費", monthTotal.expense, prevMonthSummary.expense],
                  ["粗利", monthTotal.profit, prevMonthSummary.profit],
                ] as const
              ).map(([label, now, prev]) => {
                const change = pctChange(now, prev);
                return (
                  <Fragment key={label}>
                    <span className="text-gray-400">{label}</span>
                    <span className="text-right">
                      {yen(now)}
                      {change != null && (
                        <span className={change >= 0 ? "text-[#6FB3E0]" : "text-rose"}>
                          {" "}
                          ({change >= 0 ? "+" : ""}
                          {change.toFixed(0)}%)
                        </span>
                      )}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChart((v) => !v)}
          className="w-full rounded-md border border-dashed border-[#6FB3E0] text-[#6FB3E0] py-2 text-sm font-bold mb-2"
        >
          {showChart ? "売上グラフを閉じる" : "月間売上グラフを見る"}
        </button>

        {showChart && (
          <div className="rounded-xl border border-line bg-elevated p-3 mb-2">
            <MonthlySalesChart series={chartSeries} onSelectDate={setSelectedChartDate} />
            {selectedChartDate && (
              <div className="mt-3 pt-3 border-t border-dashed border-line">
                {selectedChartRow ? (
                  <div className="grid grid-cols-2 gap-y-1 text-sm font-mono">
                    <span className="text-gray-300 font-bold">総合売上（税込）</span>
                    <span className="text-right text-[#6FB3E0] font-bold">{yen(selectedChartRow.total)}</span>
                    <span className="col-span-2 text-right text-xs text-gray-500 -mt-0.5">
                      （消費税 {yen(selectedChartRow.tax)}）
                    </span>
                    <span className="text-gray-400 mt-2">人件費（歩合給+時給）</span>
                    <span className="text-right mt-2">{yen(selectedChartRow.labor)}</span>
                    <span className="text-gray-400">経費</span>
                    <span className="text-right">{yen(selectedChartRow.expense)}</span>
                    <span className="text-gray-300 font-bold">粗利</span>
                    <span className="text-right text-[#6FB3E0] font-bold">{yen(selectedChartRow.profit)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center">この日の記録はありません</div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowCostChart((v) => !v)}
          className="w-full rounded-md border border-dashed border-rose text-rose py-2 text-sm font-bold mb-2"
        >
          {showCostChart ? "原価グラフを閉じる" : "原価グラフを見る"}
        </button>

        {showCostChart && (
          <div className="rounded-xl border border-line bg-elevated p-3 mb-2">
            <MonthlySalesChart series={costSeries} onSelectDate={setSelectedCostDate} />
            {selectedCostDate && (
              <div className="mt-3 pt-3 border-t border-dashed border-line">
                <div className="text-xs text-gray-400 mb-2">{selectedCostDate}のレシート</div>
                {selectedCostReceipts.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center">この日に添付されたレシート写真はありません</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCostReceipts.map((e) => (
                      <a key={e.id} href={e.receipt_url!} target="_blank" rel="noreferrer">
                        <img
                          src={e.receipt_url!}
                          alt={e.name}
                          className="w-full aspect-square object-cover rounded-md border border-line"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

      <button
        onClick={() => setShowReportModal(true)}
        className="w-full rounded-full bg-gradient-to-r from-rose to-gold text-white py-4 text-lg font-bold shadow-lg active:scale-95 transition-transform"
        style={{ fontFamily: "'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c', sans-serif" }}
      >
        報告レポート
      </button>

      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-xl border border-line bg-elevated p-4 space-y-3"
          >
            <div className="text-gold font-bold text-base">LINE報告用レポート</div>
            <textarea
              readOnly
              value={buildReportText()}
              className="flex-1 min-h-[300px] rounded-md bg-bg2 border border-line px-3 py-2 text-xs font-mono whitespace-pre-wrap"
            />
            <div className="text-xs text-gray-500">
              ⚪の付いた男女人数・メンション等・クーポン色・家賃・カラオケ・PayPayは自動集計できないため空欄です。コピー後に手入力してください。
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 rounded-md border border-line py-2.5 text-sm text-gray-300"
              >
                閉じる
              </button>
              <button
                onClick={copyReportText}
                className="flex-1 rounded-md bg-gold text-bg py-2.5 text-sm font-bold"
              >
                {copyLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
