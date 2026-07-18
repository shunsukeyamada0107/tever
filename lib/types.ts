export type Staff = {
  id: string;
  store_id: string;
  name: string;
  hourly_wage: number | null;
  active: boolean;
};

export type MenuItem = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  course_minutes: number | null;
  active: boolean;
};

export type Tab = {
  id: string;
  store_id: string;
  business_date: string;
  name: string;
  memo: string;
  payment_method: "cash" | "card" | null;
  guest_count: number | null;
  course_ends_at: string | null;
  created_at: string; // 来店
  closed_at: string | null; // 退店・会計
};

export type TabItem = {
  id: string;
  tab_id: string;
  staff_id: string | null;
  name: string;
  price: number;
  qty: number;
  source: "menu" | "manual";
  created_at: string;
};

export type TabWithItems = Tab & { tab_items: TabItem[] };

export type Attendance = {
  id: string;
  store_id: string;
  staff_id: string;
  business_date: string;
  clock_in: string;
  clock_out: string | null;
  wage_snapshot: number | null;
};

export type Expense = {
  id: string;
  store_id: string;
  business_date: string;
  category: string;
  name: string;
  amount: number;
  created_at: string;
};

export const EXPENSE_CATEGORIES = ["仕入れ", "消耗品", "ドリンク", "雑費", "その他"];

export const TAX_RATE = 0.10;
export const COMMISSION_RATE = 0.20;

export function itemSubtotal(item: Pick<TabItem, "price" | "qty">) {
  return item.price * item.qty;
}

export function tabSubtotal(items: TabItem[]) {
  return items.reduce((a, i) => a + itemSubtotal(i), 0);
}

export function tabTax(items: TabItem[]) {
  return Math.round(tabSubtotal(items) * TAX_RATE);
}

export function tabTotal(items: TabItem[]) {
  return tabSubtotal(items) + tabTax(items);
}

// 伝票ごとに見分けやすいよう、IDから決定的に色を割り当てる
const TAB_COLOR_PALETTE = ["#DCA84E", "#6FB3E0", "#7FCB8F", "#E08A6F", "#B78FE0", "#E0C36F", "#6FCBC0", "#E06F9E"];

export function tabColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TAB_COLOR_PALETTE[hash % TAB_COLOR_PALETTE.length];
}

// 営業日：朝6時基準（深夜0時をまたいでも同じ営業日として扱う）
export function businessDateFor(d: Date): string {
  const dd = new Date(d);
  if (dd.getHours() < 6) dd.setDate(dd.getDate() - 1);
  return dd.toISOString().slice(0, 10);
}

// 出勤からの経過時間（時間単位）
export function attHours(a: Pick<Attendance, "clock_in" | "clock_out">, nowMs = Date.now()) {
  const inMs = new Date(a.clock_in).getTime();
  const outMs = a.clock_out ? new Date(a.clock_out).getTime() : nowMs;
  return Math.max(0, (outMs - inMs) / 3600000);
}

// 時給ベースの人件費
export function dayLaborCost(attendance: Attendance[], nowMs = Date.now()) {
  return attendance.reduce((a, att) => a + attHours(att, nowMs) * (att.wage_snapshot ?? 0), 0);
}

export type StaffCommission = {
  staffId: string | null;
  name: string;
  salesExTax: number;
  salesWithTax: number;
  commission: number;
};

// 歩合給: 会計済み（closed_atがある）伝票の売上のうち、そのスタッフが記録した分の20%（税込ベース）
export function staffCommissionBreakdown(
  tabs: TabWithItems[],
  staffNameOf: (staffId: string | null) => string
): StaffCommission[] {
  const map: Record<string, StaffCommission> = {};
  tabs.forEach((t) => {
    if (!t.closed_at) return;
    const byStaff: Record<string, number> = {};
    t.tab_items.forEach((i) => {
      const key = i.staff_id ?? "unassigned";
      byStaff[key] = (byStaff[key] ?? 0) + itemSubtotal(i);
    });
    Object.entries(byStaff).forEach(([key, exTax]) => {
      const withTax = exTax * (1 + TAX_RATE);
      if (!map[key]) {
        const staffId = key === "unassigned" ? null : key;
        map[key] = { staffId, name: staffNameOf(staffId), salesExTax: 0, salesWithTax: 0, commission: 0 };
      }
      map[key].salesExTax += exTax;
      map[key].salesWithTax += withTax;
      map[key].commission += withTax * COMMISSION_RATE;
    });
  });
  return Object.values(map).sort((a, b) => b.commission - a.commission);
}

export type DaySummary = {
  subtotal: number;
  tax: number;
  total: number;
  laborHourly: number;
  commissionTotal: number;
  labor: number;
  expense: number;
  profit: number;
  cash: number;
  card: number;
  unsettled: number;
};

export function daySummary(
  tabs: TabWithItems[],
  attendance: Attendance[],
  expenses: Expense[],
  staffNameOf: (staffId: string | null) => string
): DaySummary {
  const subtotal = tabs.reduce((a, t) => a + tabSubtotal(t.tab_items), 0);
  const tax = tabs.reduce((a, t) => a + tabTax(t.tab_items), 0);
  const total = subtotal + tax;
  const laborHourly = dayLaborCost(attendance);
  const commissionTotal = staffCommissionBreakdown(tabs, staffNameOf).reduce((a, c) => a + c.commission, 0);
  const labor = laborHourly + commissionTotal;
  const expense = expenses.reduce((a, e) => a + e.amount, 0);
  let cash = 0,
    card = 0,
    unsettled = 0;
  tabs.forEach((t) => {
    const tot = tabTotal(t.tab_items);
    if (t.closed_at && t.payment_method === "cash") cash += tot;
    else if (t.closed_at && t.payment_method === "card") card += tot;
    else unsettled += tot;
  });
  return { subtotal, tax, total, laborHourly, commissionTotal, labor, expense, profit: subtotal - labor - expense, cash, card, unsettled };
}
