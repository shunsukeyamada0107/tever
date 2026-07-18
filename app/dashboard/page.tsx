"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import {
  MenuItem,
  Staff,
  TabWithItems,
  businessDateFor,
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
  const { storeId, taxRate, cutoffHour } = useStore();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tabs, setTabs] = useState<TabWithItems[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState("");
  const [newGuestCount, setNewGuestCount] = useState("");
  const [memoDraft, setMemoDraft] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | null>(null);
  const businessDate = businessDateFor(new Date(), cutoffHour);

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
  }, [loadData]);

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

  async function createTab() {
    if (!storeId || !newTabName.trim()) return;
    const { data, error } = await supabase
      .from("tabs")
      .insert({
        store_id: storeId,
        business_date: businessDate,
        name: newTabName.trim(),
        guest_count: newGuestCount.trim() === "" ? null : Number(newGuestCount),
      })
      .select()
      .single();
    if (!error && data) {
      setNewTabName("");
      setNewGuestCount("");
      setActiveTabId(data.id);
      loadData();
    }
  }

  async function addMenuItem(item: MenuItem) {
    if (!activeTab) return;
    // 同じ品目・同じ担当スタッフの行がすでにあれば数量+1、なければ新規追加
    const existing = activeTab.tab_items.find(
      (i) =>
        i.name === item.name &&
        i.price === item.price &&
        i.source === "menu" &&
        (i.staff_id ?? null) === activeStaffId
    );
    if (existing) {
      await supabase.from("tab_items").update({ qty: existing.qty + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("tab_items").insert({
        tab_id: activeTab.id,
        name: item.name,
        price: item.price,
        qty: 1,
        source: "menu",
        staff_id: activeStaffId,
      });
    }
    // 飲み放題等のコースメニューなら、伝票にタイマーをセット（起点はタップ時点から）
    if (item.course_minutes) {
      const endsAt = new Date(Date.now() + item.course_minutes * 60000).toISOString();
      await supabase.from("tabs").update({ course_ends_at: endsAt }).eq("id", activeTab.id);
      notifiedRef.current.delete(activeTab.id);
    }
    loadData();
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

  async function deleteTabItem(id: string) {
    await supabase.from("tab_items").delete().eq("id", id);
    loadData();
  }

  async function changeQty(item: TabWithItems["tab_items"][number], delta: number) {
    const qty = item.qty + delta;
    if (qty <= 0) {
      await deleteTabItem(item.id);
      return;
    }
    await supabase.from("tab_items").update({ qty }).eq("id", item.id);
    loadData();
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
                  ¥{tabTotal(t.tab_items, taxRate, t.discount_percent).toLocaleString()}
                </div>
                {lastOrder && (
                  <div className="text-xs font-bold mt-0.5 text-rose">⏰ ラストオーダー</div>
                )}
              </button>
            );
          })}
          <div className="flex gap-2 shrink-0">
            <input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="お客様名・卓番"
              className="rounded-xl bg-bg2 border-2 border-line px-2 text-sm w-28"
            />
            <input
              value={newGuestCount}
              onChange={(e) => setNewGuestCount(e.target.value)}
              placeholder="人数"
              inputMode="numeric"
              className="rounded-xl bg-bg2 border-2 border-line px-2 text-sm w-16"
            />
            <button
              onClick={createTab}
              className="rounded-xl px-3 py-2.5 text-sm font-bold border-2 border-dashed border-gold text-gold"
            >
              ＋ 新規
            </button>
          </div>
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
                      ¥{tabTotal(t.tab_items, taxRate, t.discount_percent).toLocaleString()}
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
              {!!activeTab.discount_percent && (
                <div className="flex justify-between text-rose">
                  <span>割引（{activeTab.discount_percent}%OFF）</span>
                  <span>-¥{tabDiscountAmount(activeTab.tab_items, activeTab.discount_percent).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>消費税</span>
                <span>¥{tabTax(activeTab.tab_items, taxRate, activeTab.discount_percent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gold font-bold text-lg pt-1 border-t border-dashed border-line">
                <span>合計</span>
                <span>¥{tabTotal(activeTab.tab_items, taxRate, activeTab.discount_percent).toLocaleString()}</span>
              </div>
            </div>

            {!activeTab.closed_at && (
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
                        <span className="w-6 text-center font-mono">{i.qty}</span>
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
                        onClick={() => deleteTabItem(i.id)}
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
    </div>
  );
}
