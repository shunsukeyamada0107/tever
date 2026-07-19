"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import { useBusinessDate } from "@/lib/BusinessDateContext";
import { DateBar } from "@/lib/DateBar";
import {
  MenuItem,
  Staff,
  TabItem,
  TabWithItems,
  tabColorFor,
  tabDiscountAmount,
  tabSubtotal,
  tabTax,
  tabTotal,
} from "@/lib/types";

const LAST_ORDER_WINDOW_MS = 30 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function CourseTimerBadge({ endsAt, now }: { endsAt: string; now: number }) {
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0) {
    return (
      <div className="rounded-md bg-rose/20 text-rose text-xs font-bold px-2 py-1.5 inline-block">
        ⏰ コース終了時刻を過ぎています
      </div>
    );
  }
  const mins = Math.floor(remaining / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const lastOrder = remaining <= LAST_ORDER_WINDOW_MS;
  return (
    <div
      className={`rounded-md text-xs font-bold px-2 py-1.5 inline-block ${
        lastOrder ? "bg-rose/20 text-rose" : "bg-gold/20 text-gold"
      }`}
    >
      {lastOrder ? "⏰ ラストオーダー・" : "🍺 コース残り "}
      {h > 0 ? `${h}時間` : ""}
      {m}分（{formatTime(endsAt)}まで）
    </div>
  );
}

export default function POSPage() {
  const supabase = createClient();
  const { storeId, taxRate } = useStore();
  const { date: businessDate } = useBusinessDate();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tabs, setTabs] = useState<TabWithItems[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalGuestCount, setModalGuestCount] = useState("");
  const [modalStaffId, setModalStaffId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualDiscount, setManualDiscount] = useState("");
  const [now, setNow] = useState(Date.now());
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | null>(null);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true);
    setMenu(menuData ?? []);

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true);
    setStaff(staffData ?? []);

    const { data: tabsData } = await supabase
      .from("tabs")
      .select("*, tab_items(*)")
      .eq("store_id", storeId)
      .eq("business_date", businessDate)
      .order("created_at", { ascending: true })
      .order("created_at", { foreignTable: "tab_items", ascending: true });
    setTabs((tabsData as TabWithItems[]) ?? []);
  }, [storeId, businessDate]);

  useEffect(() => {
    loadData();
    setActiveTabId(null);
  }, [loadData]);

  // tab_items の連続操作（連打）が競合しないよう、常に最新の状態を同期的に参照するためのref
  const tabsRef = useRef<TabWithItems[]>([]);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  // 書き込み系の操作を1件ずつ順番に実行するためのキュー
  const writeQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  function enqueue(fn: () => Promise<void>) {
    const run = writeQueueRef.current.then(fn, fn);
    writeQueueRef.current = run.catch(() => {});
    return run;
  }

  function applyLocalTabItems(tabId: string, updater: (items: TabItem[]) => TabItem[]) {
    const updated = tabsRef.current.map((t) => (t.id === tabId ? { ...t, tab_items: updater(t.tab_items) } : t));
    tabsRef.current = updated;
    setTabs(updated);
  }

  function findLocalItem(tabId: string, snapshot: TabItem) {
    const tab = tabsRef.current.find((t) => t.id === tabId);
    if (!tab) return null;
    return (
      tab.tab_items.find((i) => i.id === snapshot.id) ??
      tab.tab_items.find(
        (i) =>
          i.name === snapshot.name &&
          i.price === snapshot.price &&
          i.staff_id === snapshot.staff_id &&
          i.source === snapshot.source
      ) ??
      null
    );
  }

  useEffect(() => {
    if (typeof Notification !== "undefined") setNotifyPermission(Notification.permission);
  }, []);

  // ラストオーダー判定・タイマー表示のための定期更新
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  // コース終了30分前になったら通知（伝票ごとに1回だけ）
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (notifyPermission !== "granted") return;
    tabs.forEach((t) => {
      if (!t.course_ends_at || t.closed_at) return;
      const remaining = new Date(t.course_ends_at).getTime() - now;
      if (remaining <= LAST_ORDER_WINDOW_MS && remaining > 0 && !notifiedRef.current.has(t.id)) {
        notifiedRef.current.add(t.id);
        new Notification("ラストオーダーの時間です", { body: `${t.name} のコースがまもなく終了します` });
      }
    });
  }, [tabs, now, notifyPermission]);

  async function requestNotifyPermission() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setNotifyPermission(p);
  }

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  useEffect(() => {
    setMemoDraft(activeTab?.memo ?? "");
  }, [activeTab?.id, activeTab?.memo]);

  function staffName(staffId: string | null) {
    if (!staffId) return null;
    return staff.find((s) => s.id === staffId)?.name ?? "(元スタッフ)";
  }

  function openCreateModal() {
    setModalName("");
    setModalGuestCount("");
    setModalStaffId(null);
    setShowCreateModal(true);
  }

  async function createTab() {
    if (!storeId || !modalName.trim()) return;
    const { data, error } = await supabase
      .from("tabs")
      .insert({
        store_id: storeId,
        business_date: businessDate,
        name: modalName.trim(),
        guest_count: modalGuestCount.trim() === "" ? null : Number(modalGuestCount),
      })
      .select()
      .single();
    if (!error && data) {
      setActiveTabId(data.id);
      setActiveStaffId(modalStaffId);
      setShowCreateModal(false);
      loadData();
    }
  }

  function addMenuItem(item: MenuItem) {
    if (!activeTabId) return;
    const tabId = activeTabId;
    const staffId = activeStaffId;

    enqueue(async () => {
      const tab = tabsRef.current.find((t) => t.id === tabId);
      if (!tab) return;
      // 同じ品目・同じ担当スタッフの行がすでにあれば数量+1、なければ新規追加
      const existing = tab.tab_items.find(
        (i) => i.name === item.name && i.price === item.price && i.source === "menu" && (i.staff_id ?? null) === staffId
      );

      if (existing) {
        const newQty = existing.qty + 1;
        applyLocalTabItems(tabId, (items) => items.map((i) => (i.id === existing.id ? { ...i, qty: newQty } : i)));
        await supabase.from("tab_items").update({ qty: newQty }).eq("id", existing.id);
      } else {
        const tempId = `temp-${Math.random().toString(36).slice(2)}`;
        const optimisticItem: TabItem = {
          id: tempId,
          tab_id: tabId,
          staff_id: staffId,
          name: item.name,
          price: item.price,
          qty: 1,
          source: "menu",
          created_at: new Date().toISOString(),
        };
        applyLocalTabItems(tabId, (items) => [...items, optimisticItem]);
        const { data } = await supabase
          .from("tab_items")
          .insert({ tab_id: tabId, name: item.name, price: item.price, qty: 1, source: "menu", staff_id: staffId })
          .select()
          .single();
        if (data) {
          applyLocalTabItems(tabId, (items) => items.map((i) => (i.id === tempId ? (data as TabItem) : i)));
        }
      }

      // 飲み放題等のコースメニューなら、伝票にタイマーをセット（起点はタップ時点から）
      if (item.course_minutes) {
        const endsAt = new Date(Date.now() + item.course_minutes * 60000).toISOString();
        await supabase.from("tabs").update({ course_ends_at: endsAt }).eq("id", tabId);
        notifiedRef.current.delete(tabId);
      }
      loadData();
    });
  }

  async function saveGuestCount(count: string) {
    if (!activeTab) return;
    await supabase
      .from("tabs")
      .update({ guest_count: count.trim() === "" ? null : Number(count) })
      .eq("id", activeTab.id);
    loadData();
  }

  async function addManualItem() {
    if (!activeTab || !manualName.trim() || !manualPrice.trim()) return;
    await supabase.from("tab_items").insert({
      tab_id: activeTab.id,
      name: manualName.trim(),
      price: Number(manualPrice),
      qty: 1,
      source: "manual",
      staff_id: activeStaffId,
    });
    setManualName("");
    setManualPrice("");
    loadData();
  }

  function deleteTabItem(item: TabItem) {
    if (!activeTabId) return;
    const tabId = activeTabId;
    enqueue(async () => {
      const current = findLocalItem(tabId, item);
      if (!current) return;
      applyLocalTabItems(tabId, (items) => items.filter((i) => i.id !== current.id));
      if (!current.id.startsWith("temp-")) {
        await supabase.from("tab_items").delete().eq("id", current.id);
      }
      loadData();
    });
  }

  function setQty(item: TabItem, qty: number) {
    if (!activeTabId) return;
    if (qty <= 0) {
      deleteTabItem(item);
      return;
    }
    const tabId = activeTabId;
    enqueue(async () => {
      const current = findLocalItem(tabId, item);
      if (!current) return;
      applyLocalTabItems(tabId, (items) => items.map((i) => (i.id === current.id ? { ...i, qty } : i)));
      await supabase.from("tab_items").update({ qty }).eq("id", current.id);
      loadData();
    });
  }

  function changeQty(item: TabItem, delta: number) {
    setQty(item, item.qty + delta);
  }

  async function saveMemo() {
    if (!activeTab) return;
    await supabase.from("tabs").update({ memo: memoDraft }).eq("id", activeTab.id);
    loadData();
  }

  async function setDiscount(percent: number | null) {
    if (!activeTab) return;
    await supabase.from("tabs").update({ discount_percent: percent }).eq("id", activeTab.id);
    loadData();
  }

  async function applyManualDiscount() {
    if (!activeTab || !manualDiscount.trim()) return;
    await supabase
      .from("tabs")
      .update({ discount_amount: Number(manualDiscount) })
      .eq("id", activeTab.id);
    setManualDiscount("");
    loadData();
  }

  async function clearManualDiscount() {
    if (!activeTab) return;
    await supabase.from("tabs").update({ discount_amount: null }).eq("id", activeTab.id);
    loadData();
  }

  async function settleTab(method: "cash" | "card") {
    if (!activeTab) return;
    await supabase
      .from("tabs")
      .update({ payment_method: method, closed_at: new Date().toISOString() })
      .eq("id", activeTab.id);
    loadData();
  }

  async function reopenTab() {
    if (!activeTab) return;
    await supabase
      .from("tabs")
      .update({ payment_method: null, closed_at: null })
      .eq("id", activeTab.id);
    loadData();
  }

  async function deleteTab() {
    if (!activeTab) return;
    if (!confirm(`「${activeTab.name}」の伝票を削除しますか？（元に戻せません）`)) return;
    await supabase.from("tabs").delete().eq("id", activeTab.id);
    setActiveTabId(null);
    loadData();
  }

  const openTabs = tabs.filter((t) => !t.closed_at);
  const closedTabs = tabs.filter((t) => t.closed_at);

  return (
    <div className="space-y-4">
      <DateBar />
      <div>
        <div className="text-gold font-bold text-sm mb-2">伝票（お客様・卓）・対応中 {openTabs.length}件</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {openTabs.map((t) => {
            const active = t.id === activeTabId;
            const remaining = t.course_ends_at ? new Date(t.course_ends_at).getTime() - now : null;
            const lastOrder = remaining !== null && remaining > 0 && remaining <= LAST_ORDER_WINDOW_MS;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTabId(t.id)}
                style={{ borderLeftColor: tabColorFor(t.id), borderLeftWidth: 5 }}
                className={`shrink-0 min-w-[104px] text-left rounded-xl px-3 py-2.5 border-2 ${
                  active
                    ? "bg-gold border-gold text-bg"
                    : "bg-elevated border-line text-gray-200"
                }`}
              >
                <div className="text-sm font-bold truncate">
                  {t.name}
                  {t.guest_count != null && <span className="font-normal"> ・{t.guest_count}名</span>}
                </div>
                <div className={`text-xs font-mono mt-0.5 ${active ? "text-bg/70" : "text-gray-400"}`}>
                  ¥{tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount).toLocaleString()}
                </div>
                {lastOrder && (
                  <div className="text-xs font-bold mt-0.5 text-rose">⏰ ラストオーダー</div>
                )}
              </button>
            );
          })}
          <button
            onClick={openCreateModal}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold border-2 border-dashed border-gold text-gold whitespace-nowrap"
          >
            📝 伝票を作る
          </button>
        </div>

        {closedTabs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-line">
            <div className="text-xs text-gray-500 mb-2">✓ 会計済み（{closedTabs.length}件）</div>
            <div className="flex gap-2 overflow-x-auto">
              {closedTabs.map((t) => {
                const active = t.id === activeTabId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTabId(t.id)}
                    style={{ borderLeftColor: tabColorFor(t.id), borderLeftWidth: 5 }}
                    className={`shrink-0 min-w-[104px] text-left rounded-xl px-3 py-2.5 border-2 opacity-70 ${
                      active ? "border-gold text-gray-200" : "border-line text-gray-400"
                    } bg-elevated`}
                  >
                    <div className="text-sm font-bold truncate">
                      {t.payment_method === "cash" ? "💴" : "💳"} {t.name}
                    </div>
                    <div className="text-xs font-mono mt-0.5">
                      ¥{tabTotal(t.tab_items, taxRate, t.discount_percent, t.discount_amount).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeTab && (
        <>
          <div
            style={{ borderLeftColor: tabColorFor(activeTab.id), borderLeftWidth: 5 }}
            className="rounded-xl border border-line bg-elevated p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{activeTab.name}</span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-bold ${
                    activeTab.closed_at ? "bg-line text-gray-300" : "bg-gold/20 text-gold"
                  }`}
                >
                  {activeTab.closed_at ? "会計済み" : "対応中"}
                </span>
              </div>
              <button onClick={deleteTab} className="text-xs text-rose">
                伝票を削除
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>
                来店 {formatTime(activeTab.created_at)}
                {activeTab.closed_at && <> ・退店 {formatTime(activeTab.closed_at)}</>}
              </span>
              {!activeTab.closed_at && (
                <span className="flex items-center gap-1">
                  人数
                  <input
                    defaultValue={activeTab.guest_count ?? ""}
                    onBlur={(e) => saveGuestCount(e.target.value)}
                    inputMode="numeric"
                    placeholder="-"
                    className="w-12 rounded-md bg-bg2 border border-line px-1.5 py-0.5 text-xs text-center"
                  />
                  名
                </span>
              )}
            </div>

            {activeTab.course_ends_at && <CourseTimerBadge endsAt={activeTab.course_ends_at} now={now} />}

            {notifyPermission === "default" && (
              <button
                onClick={requestNotifyPermission}
                className="text-xs rounded-md border border-dashed border-line px-2 py-1 text-gray-400"
              >
                🔔 ラストオーダー通知を有効にする
              </button>
            )}

            <div className="rounded-lg bg-bg2 px-3 py-2 font-mono text-sm space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>小計</span>
                <span>¥{tabSubtotal(activeTab.tab_items).toLocaleString()}</span>
              </div>
              {!!(activeTab.discount_percent || activeTab.discount_amount) && (
                <div className="flex justify-between text-rose">
                  <span>
                    割引
                    {activeTab.discount_percent ? `（${activeTab.discount_percent}%OFF）` : ""}
                  </span>
                  <span>
                    -¥
                    {tabDiscountAmount(
                      activeTab.tab_items,
                      activeTab.discount_percent,
                      activeTab.discount_amount
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>消費税</span>
                <span>
                  ¥
                  {tabTax(
                    activeTab.tab_items,
                    taxRate,
                    activeTab.discount_percent,
                    activeTab.discount_amount
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gold font-bold text-lg pt-1 border-t border-dashed border-line">
                <span>合計</span>
                <span>
                  ¥
                  {tabTotal(
                    activeTab.tab_items,
                    taxRate,
                    activeTab.discount_percent,
                    activeTab.discount_amount
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {!activeTab.closed_at && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {[30, 50].map((p) => (
                    <button
                      key={p}
                      onClick={() => setDiscount(activeTab.discount_percent === p ? null : p)}
                      className={`text-xs rounded-md px-3 py-1.5 font-bold border ${
                        activeTab.discount_percent === p
                          ? "bg-rose text-white border-rose"
                          : "border-line text-gray-300"
                      }`}
                    >
                      🎟 {p}%OFF
                    </button>
                  ))}
                  {activeTab.discount_percent != null && (
                    <button
                      onClick={() => setDiscount(null)}
                      className="text-xs rounded-md px-3 py-1.5 border border-line text-gray-400"
                    >
                      割引解除
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(e.target.value)}
                    placeholder="値引き額（円）"
                    inputMode="numeric"
                    className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={applyManualDiscount}
                    className="text-xs rounded-md px-3 py-1.5 font-bold border border-dashed border-rose text-rose shrink-0"
                  >
                    値引き適用
                  </button>
                  {activeTab.discount_amount != null && (
                    <button
                      onClick={clearManualDiscount}
                      className="text-xs rounded-md px-3 py-1.5 border border-line text-gray-400 shrink-0"
                    >
                      解除
                    </button>
                  )}
                </div>
              </div>
            )}

            {!activeTab.closed_at ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => settleTab("cash")}
                  className="rounded-xl bg-gold text-bg font-bold py-4 text-base flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl leading-none">💴</span>
                  現金で会計
                </button>
                <button
                  onClick={() => settleTab("card")}
                  className="rounded-xl bg-gold text-bg font-bold py-4 text-base flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-2xl leading-none">💳</span>
                  カードで会計
                </button>
              </div>
            ) : (
              <button
                onClick={reopenTab}
                className="w-full rounded-xl border-2 border-line py-3 text-sm font-bold text-gray-300"
              >
                会計を取り消す
              </button>
            )}

            <div className="flex gap-2 pt-1">
              <input
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value)}
                placeholder="補足欄（例：奥のテーブル、常連さん 等）"
                className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1.5 text-xs"
              />
              <button
                onClick={saveMemo}
                disabled={memoDraft === (activeTab.memo ?? "")}
                className="text-xs rounded-md border border-line px-3 py-1.5 text-gray-300 disabled:opacity-40 shrink-0"
              >
                保存
              </button>
            </div>
          </div>

          {staff.length > 0 && (
            <div>
              <div className="text-gold font-bold text-sm mb-2">担当スタッフ</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStaffId(activeStaffId === s.id ? null : s.id)}
                    className={`shrink-0 rounded-full px-3 py-2 text-sm border ${
                      activeStaffId === s.id
                        ? "bg-gold text-bg border-gold"
                        : "bg-elevated text-gray-300 border-line"
                    }`}
                  >
                    👤 {s.name}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                選択中のスタッフに、これから記録する商品の売上が紐づきます（もう一度タップで解除）
              </div>
            </div>
          )}

          <div>
            <div className="text-gold font-bold text-sm mb-2">メニュー</div>
            <div className="grid grid-cols-2 gap-2">
              {menu.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addMenuItem(m)}
                  disabled={!!activeTab.closed_at}
                  className="group rounded-lg border border-line bg-elevated p-3 text-left disabled:opacity-40 active:bg-gold active:border-gold transition-colors"
                >
                  <div className="text-sm font-bold group-active:text-bg">
                    {m.name}
                    {m.course_minutes != null && (
                      <span className="text-xs font-normal opacity-70"> ・⏱{m.course_minutes}分</span>
                    )}
                  </div>
                  <div className="text-xs text-gold font-mono group-active:text-bg">
                    ¥{m.price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!activeTab.closed_at && (
            <div>
              <div className="text-gold font-bold text-sm mb-2">自由入力で追加</div>
              <div className="flex gap-2">
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="品名"
                  className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
                />
                <input
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="金額"
                  inputMode="numeric"
                  className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
                />
                <button
                  onClick={addManualItem}
                  className="rounded-md px-3 py-1.5 text-sm border border-dashed border-gold text-gold shrink-0"
                >
                  ＋ 追加
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="text-gold font-bold text-sm mb-2">
              伝票内容（{activeTab.tab_items.reduce((a, i) => a + i.qty, 0)}点）
            </div>
            {activeTab.tab_items.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
                まだ商品が記録されていません
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-elevated divide-y divide-line overflow-hidden">
                {activeTab.tab_items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{i.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        ¥{i.price.toLocaleString()} / 個
                        {staffName(i.staff_id) && <span> ・👤{staffName(i.staff_id)}</span>}
                      </div>
                    </div>

                    {!activeTab.closed_at ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => changeQty(i, -1)}
                          className="w-8 h-8 rounded-lg border border-line text-gray-300 text-lg leading-none"
                        >
                          −
                        </button>
                        <input
                          key={`${i.id}-${i.qty}`}
                          defaultValue={i.qty}
                          onBlur={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n)) setQty(i, Math.floor(n));
                          }}
                          inputMode="numeric"
                          className="w-10 text-center font-mono bg-bg2 border border-line rounded-md py-1"
                        />
                        <button
                          onClick={() => changeQty(i, 1)}
                          className="w-8 h-8 rounded-lg border border-line text-gray-300 text-lg leading-none"
                        >
                          ＋
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-gray-400 shrink-0">× {i.qty}</span>
                    )}

                    <div className="w-20 text-right font-mono font-bold text-gold shrink-0">
                      ¥{(i.price * i.qty).toLocaleString()}
                    </div>

                    {!activeTab.closed_at && (
                      <button
                        onClick={() => deleteTabItem(i)}
                        className="text-rose text-lg shrink-0 w-6"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!activeTab && (
        <div className="text-sm text-gray-500 text-center py-10 border border-dashed border-line rounded-xl">
          伝票を選択するか、新しく作成してください
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-line bg-elevated p-4 space-y-4"
          >
            <div className="text-gold font-bold text-base">伝票を作る</div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">名前・卓番</label>
              <input
                autoFocus
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                placeholder="例：田中様・3卓"
                className="w-full rounded-md bg-bg2 border border-line px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">人数（任意）</label>
              <input
                value={modalGuestCount}
                onChange={(e) => setModalGuestCount(e.target.value)}
                inputMode="numeric"
                placeholder="例：4"
                className="w-24 rounded-md bg-bg2 border border-line px-3 py-2 text-sm"
              />
            </div>

            {staff.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">担当スタッフ（任意）</label>
                <div className="flex gap-2 flex-wrap">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setModalStaffId(modalStaffId === s.id ? null : s.id)}
                      className={`rounded-full px-3 py-1.5 text-sm border ${
                        modalStaffId === s.id
                          ? "bg-gold text-bg border-gold"
                          : "bg-bg2 text-gray-300 border-line"
                      }`}
                    >
                      👤 {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-md border border-line py-2.5 text-sm text-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={createTab}
                disabled={!modalName.trim()}
                className="flex-1 rounded-md bg-gold text-bg py-2.5 text-sm font-bold disabled:opacity-50"
              >
                作成する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
