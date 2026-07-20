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
  discount_percent: number | null;
  discount_amount: number | null;
  staff_id: string | null; // この伝票の担当スタッフ（歩合給の対象）
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
  receipt_url: string | null;
  created_at: string;
};

export const EXPENSE_CATEGORIES = ["仕入れ", "消耗品", "雑費", "その他"];

// 店舗設定が未取得の場合のフォールバック値
export const DEFAULT_TAX_RATE = 0.10;
export const DEFAULT_COMMISSION_RATE = 0.20;
export const DEFAULT_BUSINESS_DAY_CUTOFF_HOUR = 6;

export function itemSubtotal(item: Pick<TabItem, "price" | "qty">) {
  return item.price * item.qty;
}

export function tabSubtotal(items: TabItem[]) {
  return items.reduce((a, i) => a + itemSubtotal(i), 0);
}

// 割引額（％割引 + 自由入力の値引き額の合計。税抜小計を超えない）
export function tabDiscountAmount(
  items: TabItem[],
  discountPercent: number | null | undefined,
  discountAmount: number | null | undefined = null
) {
  const sub = tabSubtotal(items);
  const percentPart = discountPercent ? Math.round(sub * (discountPercent / 100)) : 0;
  const fixedPart = discountAmount ?? 0;
  return Math.min(sub, percentPart + fixedPart);
}

// 割引後の税抜小計（消費税の計算対象）
export function tabTaxableSubtotal(
  items: TabItem[],
  discountPercent: number | null | undefined,
  discountAmount: number | null | undefined = null
) {
  return tabSubtotal(items) - tabDiscountAmount(items, discountPercent, discountAmount);
}

export function tabTax(
  items: TabItem[],
  taxRate: number = DEFAULT_TAX_RATE,
  discountPercent: number | null | undefined = null,
  discountAmount: number | null | undefined = null
) {
  return Math.round(tabTaxableSubtotal(items, discountPercent, discountAmount) * taxRate);
}

// 会計時の端数は100円単位で切り上げる（例: 1120円→1200円）
export function roundUpTo100(n: number) {
  return Math.ceil(n / 100) * 100;
}

export function tabTotal(
  items: TabItem[],
  taxRate: number = DEFAULT_TAX_RATE,
  discountPercent: number | null | undefined = null,
  discountAmount: number | null | undefined = null
) {
  const raw =
    tabTaxableSubtotal(items, discountPercent, discountAmount) +
    tabTax(items, taxRate, discountPercent, discountAmount);
  return roundUpTo100(raw);
}

// 伝票ごとに見分けやすいよう、IDから決定的に色を割り当てる
const TAB_COLOR_PALETTE = ["#DCA84E", "#6FB3E0", "#7FCB8F", "#E08A6F", "#B78FE0", "#E0C36F", "#6FCBC0", "#E06F9E"];

export function tabColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TAB_COLOR_PALETTE[hash % TAB_COLOR_PALETTE.length];
}

// 営業日：指定した切り替え時刻より前は前日扱い（深夜0時をまたいでも同じ営業日として扱う）
export function businessDateFor(d: Date, cutoffHour: number = DEFAULT_BUSINESS_DAY_CUTOFF_HOUR): string {
  const dd = new Date(d);
  if (dd.getHours() < cutoffHour) dd.setDate(dd.getDate() - 1);
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

export type HourlyLaborRow = { staffId: string; name: string; hours: number; cost: number };

// 時給が設定されている出退勤記録だけを対象に、スタッフ別の勤務時間・人件費を集計する
export function hourlyLaborBreakdown(
  attendance: Attendance[],
  staffNameOf: (staffId: string | null) => string,
  nowMs = Date.now()
): HourlyLaborRow[] {
  const map: Record<string, HourlyLaborRow> = {};
  attendance.forEach((a) => {
    if (a.wage_snapshot == null) return;
    if (!map[a.staff_id]) map[a.staff_id] = { staffId: a.staff_id, name: staffNameOf(a.staff_id), hours: 0, cost: 0 };
    const hrs = attHours(a, nowMs);
    map[a.staff_id].hours += hrs;
    map[a.staff_id].cost += hrs * a.wage_snapshot;
  });
  return Object.values(map).sort((a, b) => b.cost - a.cost);
}

export type StaffCommission = {
  staffId: string | null;
  name: string;
  salesExTax: number;
  salesWithTax: number;
  commission: number;
};

// 歩合給: 会計済み（closed_atがある）伝票の実際の会計額（100円切り上げ後の合計）に対して、
// その伝票の担当スタッフ（tabs.staff_id）1人に歩合率をかける（品目ごとではなく伝票単位）
export function staffCommissionBreakdown(
  tabs: TabWithItems[],
  staffNameOf: (staffId: string | null) => string,
  taxRate: number = DEFAULT_TAX_RATE,
  commissionRate: number = DEFAULT_COMMISSION_RATE
): StaffCommission[] {
  const map: Record<string, StaffCommission> = {};
  tabs.forEach((t) => {
    if (!t.closed_at) return;
    // 担当スタッフが未設定の伝票は店舗の客として扱い、歩合の対象にしない
    if (!t.staff_id) return;
    const key = t.staff_id;
    const taxableSubtotal = tabTaxableSubtotal(t.tab_items, t.discount_percent, t.discount_amount);
    const actualTotal = tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount);

    if (!map[key]) {
      map[key] = { staffId: key, name: staffNameOf(key), salesExTax: 0, salesWithTax: 0, commission: 0 };
    }
    map[key].salesExTax += taxableSubtotal;
    map[key].salesWithTax += actualTotal;
    map[key].commission += actualTotal * commissionRate;
  });
  return Object.values(map).sort((a, b) => b.commission - a.commission);
}

export type DaySummary = {
  subtotal: number;
  tax: number;
  roundingAdjustment: number;
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
  staffNameOf: (staffId: string | null) => string,
  taxRate: number = DEFAULT_TAX_RATE,
  commissionRate: number = DEFAULT_COMMISSION_RATE
): DaySummary {
  const subtotal = tabs.reduce(
    (a, t) => a + tabTaxableSubtotal(t.tab_items, t.discount_percent, t.discount_amount),
    0
  );
  const tax = tabs.reduce((a, t) => a + tabTax(t.tab_items, taxRate, t.discount_percent, t.discount_amount), 0);
  const laborHourly = dayLaborCost(attendance);
  const commissionTotal = staffCommissionBreakdown(tabs, staffNameOf, taxRate, commissionRate).reduce(
    (a, c) => a + c.commission,
    0
  );
  const labor = laborHourly + commissionTotal;
  const expense = expenses.reduce((a, e) => a + e.amount, 0);
  let cash = 0,
    card = 0,
    unsettled = 0;
  tabs.forEach((t) => {
    const tot = tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount);
    if (t.closed_at && t.payment_method === "cash") cash += tot;
    else if (t.closed_at && t.payment_method === "card") card += tot;
    else unsettled += tot;
  });
  // 合計は実際に会計する（100円単位切り上げ後の）金額を必ず使う：現金＋カード＋未会計と一致する
  const total = cash + card + unsettled;
  const roundingAdjustment = total - (subtotal + tax);
  return {
    subtotal,
    tax,
    roundingAdjustment,
    total,
    laborHourly,
    commissionTotal,
    labor,
    expense,
    profit: subtotal - labor - expense,
    cash,
    card,
    unsettled,
  };
}
