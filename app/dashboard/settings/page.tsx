"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import { MenuItem, Staff, CommissionScheme, DEFAULT_DRINK_BACK_AMOUNT } from "@/lib/types";
import { DEFAULT_REPORT_TEMPLATE, REPORT_TEMPLATE_TOKENS } from "@/lib/reportTemplate";

const CUTOFF_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsPage() {
  const supabase = createClient();
  const {
    storeId,
    taxRate,
    commissionRate,
    cutoffHour,
    reportTemplate,
    cashFloatAmount,
    accentColor,
    commissionScheme,
    drinkBackAmount,
    reload,
  } = useStore();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCourseMinutes, setMenuCourseMinutes] = useState("");
  const [menuIsCastDrink, setMenuIsCastDrink] = useState(false);
  const [wageDrafts, setWageDrafts] = useState<Record<string, string>>({});
  const [menuNameDrafts, setMenuNameDrafts] = useState<Record<string, string>>({});
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const [taxRateDraft, setTaxRateDraft] = useState(String(Math.round(taxRate * 100)));
  const [commissionRateDraft, setCommissionRateDraft] = useState(String(Math.round(commissionRate * 100)));
  const [cutoffHourDraft, setCutoffHourDraft] = useState(String(cutoffHour));
  const [cashFloatDraft, setCashFloatDraft] = useState(String(cashFloatAmount));
  const [accentColorDraft, setAccentColorDraft] = useState(accentColor);
  const [commissionSchemeDraft, setCommissionSchemeDraft] = useState<CommissionScheme>(commissionScheme);
  const [drinkBackAmountDraft, setDrinkBackAmountDraft] = useState(String(drinkBackAmount));
  const [savingStoreSettings, setSavingStoreSettings] = useState(false);
  const [templateDraft, setTemplateDraft] = useState(reportTemplate ?? DEFAULT_REPORT_TEMPLATE);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  useEffect(() => {
    setTaxRateDraft(String(Math.round(taxRate * 100)));
    setCommissionRateDraft(String(Math.round(commissionRate * 100)));
    setCutoffHourDraft(String(cutoffHour));
    setTemplateDraft(reportTemplate ?? DEFAULT_REPORT_TEMPLATE);
    setCashFloatDraft(String(cashFloatAmount));
    setAccentColorDraft(accentColor);
    setCommissionSchemeDraft(commissionScheme);
    setDrinkBackAmountDraft(String(drinkBackAmount));
  }, [
    taxRate,
    commissionRate,
    cutoffHour,
    reportTemplate,
    cashFloatAmount,
    accentColor,
    commissionScheme,
    drinkBackAmount,
  ]);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    setMenu(menuData ?? []);
    setMenuNameDrafts(Object.fromEntries((menuData ?? []).map((m) => [m.id, m.name])));

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: true });
    setStaff(staffData ?? []);
    setWageDrafts(
      Object.fromEntries((staffData ?? []).map((s) => [s.id, s.hourly_wage != null ? String(s.hourly_wage) : ""]))
    );
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addMenuItem() {
    if (!storeId || !menuName.trim() || !menuPrice.trim()) return;
    const nextSortOrder = menu.reduce((max, m) => Math.max(max, m.sort_order), 0) + 1;
    await supabase.from("menu_items").insert({
      store_id: storeId,
      name: menuName.trim(),
      price: Number(menuPrice),
      course_minutes: menuCourseMinutes.trim() === "" ? null : Number(menuCourseMinutes),
      sort_order: nextSortOrder,
      is_cast_drink: menuIsCastDrink,
    });
    setMenuName("");
    setMenuPrice("");
    setMenuCourseMinutes("");
    setMenuIsCastDrink(false);
    loadData();
  }

  async function toggleCastDrink(m: MenuItem) {
    await supabase.from("menu_items").update({ is_cast_drink: !m.is_cast_drink }).eq("id", m.id);
    loadData();
  }

  async function removeMenuItem(id: string) {
    await supabase.from("menu_items").update({ active: false }).eq("id", id);
    loadData();
  }

  async function saveMenuName(id: string) {
    const name = (menuNameDrafts[id] ?? "").trim();
    if (!name) return;
    await supabase.from("menu_items").update({ name }).eq("id", id);
    loadData();
  }

  async function moveMenuItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= menu.length) return;
    const current = menu[index];
    const target = menu[targetIndex];
    setReorderingId(current.id);
    await Promise.all([
      supabase.from("menu_items").update({ sort_order: target.sort_order }).eq("id", current.id),
      supabase.from("menu_items").update({ sort_order: current.sort_order }).eq("id", target.id),
    ]);
    setReorderingId(null);
    loadData();
  }

  async function saveWage(staffId: string) {
    const raw = wageDrafts[staffId] ?? "";
    const wage = raw.trim() === "" ? null : Number(raw);
    await supabase.from("staff").update({ hourly_wage: wage }).eq("id", staffId);
    loadData();
  }

  async function removeStaff(id: string) {
    await supabase.from("staff").update({ active: false }).eq("id", id);
    loadData();
  }

  async function saveStoreSettings() {
    if (!storeId) return;
    setSavingStoreSettings(true);
    await supabase
      .from("stores")
      .update({
        tax_rate: Number(taxRateDraft) / 100,
        commission_rate: Number(commissionRateDraft) / 100,
        business_day_cutoff_hour: Number(cutoffHourDraft),
        cash_float_amount: Number(cashFloatDraft) || 0,
        accent_color: accentColorDraft,
        commission_scheme: commissionSchemeDraft,
        drink_back_amount: Number(drinkBackAmountDraft) || 0,
      })
      .eq("id", storeId);
    setSavingStoreSettings(false);
    reload();
  }

  async function saveTemplate() {
    if (!storeId) return;
    setSavingTemplate(true);
    await supabase.from("stores").update({ report_template: templateDraft }).eq("id", storeId);
    setSavingTemplate(false);
    reload();
  }

  function resetTemplate() {
    setTemplateDraft(DEFAULT_REPORT_TEMPLATE);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-gold font-bold text-sm mb-2">店舗設定</div>
        <div className="rounded-xl border border-line bg-elevated p-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">消費税率（%）</label>
            <input
              value={taxRateDraft}
              onChange={(e) => setTaxRateDraft(e.target.value)}
              inputMode="numeric"
              className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">歩合の計算方式</label>
            <select
              value={commissionSchemeDraft}
              onChange={(e) => setCommissionSchemeDraft(e.target.value as CommissionScheme)}
              className="w-full rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            >
              <option value="simple">売上の一律%（シンプル）</option>
              <option value="drink_back">売上バック＋ドリンクバック</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {commissionSchemeDraft === "drink_back"
                ? "（担当伝票の売上 − キャストドリンク代）× 歩合率 ＋ キャストドリンク数 × ドリンクバック単価"
                : "担当した伝票の売上（実会計額）に、そのまま歩合率を掛けます"}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {commissionSchemeDraft === "drink_back" ? "売上バック率（%）" : "歩合率（%）"}
            </label>
            <input
              value={commissionRateDraft}
              onChange={(e) => setCommissionRateDraft(e.target.value)}
              inputMode="numeric"
              className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
          </div>
          {commissionSchemeDraft === "drink_back" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">ドリンクバック単価（1杯あたり・円）</label>
              <input
                value={drinkBackAmountDraft}
                onChange={(e) => setDrinkBackAmountDraft(e.target.value)}
                inputMode="numeric"
                placeholder={String(DEFAULT_DRINK_BACK_AMOUNT)}
                className="w-28 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              営業日の切り替え時刻（この時刻より前は前日の営業として記録されます）
            </label>
            <select
              value={cutoffHourDraft}
              onChange={(e) => setCutoffHourDraft(e.target.value)}
              className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            >
              {CUTOFF_HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}時
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              釣り銭元金（営業終了後に金庫に残す固定額）
            </label>
            <input
              value={cashFloatDraft}
              onChange={(e) => setCashFloatDraft(e.target.value)}
              inputMode="numeric"
              className="w-28 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">ブランドカラー（アプリ内の強調色）</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColorDraft}
                onChange={(e) => setAccentColorDraft(e.target.value)}
                className="w-10 h-9 rounded-md bg-bg2 border border-line p-0.5 cursor-pointer"
              />
              <span className="text-xs text-gray-400 font-mono">{accentColorDraft}</span>
            </div>
          </div>
          <button
            onClick={saveStoreSettings}
            disabled={savingStoreSettings}
            className="rounded-md bg-gold text-bg px-3 py-1.5 text-sm font-bold disabled:opacity-50"
          >
            {savingStoreSettings ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">LINE報告レポートのひな形</div>
        <div className="rounded-xl border border-line bg-elevated p-3 space-y-2">
          <div className="text-xs text-gray-500">
            集計タブの「報告レポート」ボタンで生成される文章のひな形です。{"{{sales}}"}
            のようなタグを好きな場所に入れて、自由に文言・並び順を変更できます。
          </div>
          <textarea
            value={templateDraft}
            onChange={(e) => setTemplateDraft(e.target.value)}
            rows={14}
            className="w-full rounded-md bg-bg2 border border-line px-3 py-2 text-xs font-mono whitespace-pre"
          />
          <button
            onClick={() => setShowTokenHelp((v) => !v)}
            className="text-xs text-gold"
          >
            {showTokenHelp ? "使えるタグを隠す" : "使えるタグ一覧を見る"}
          </button>
          {showTokenHelp && (
            <div className="rounded-md bg-bg2 border border-line p-2 text-xs text-gray-400 space-y-0.5 max-h-48 overflow-y-auto">
              {REPORT_TEMPLATE_TOKENS.map((t) => (
                <div key={t.token}>
                  <span className="text-gold font-mono">{`{{${t.token}}}`}</span> — {t.label}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={resetTemplate}
              className="flex-1 rounded-md border border-line py-2 text-sm text-gray-300"
            >
              既定に戻す
            </button>
            <button
              onClick={saveTemplate}
              disabled={savingTemplate}
              className="flex-1 rounded-md bg-gold text-bg py-2 text-sm font-bold disabled:opacity-50"
            >
              {savingTemplate ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">メニュー管理</div>
        <div className="rounded-xl border border-line bg-elevated divide-y divide-line mb-2">
          {menu.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6">メニューが未登録です</div>
          )}
          {menu.map((m, i) => (
            <div key={m.id} className="flex justify-between items-center px-3 py-2 text-sm gap-2">
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => moveMenuItem(i, -1)}
                  disabled={i === 0 || reorderingId !== null}
                  className="text-gray-400 disabled:opacity-20 leading-none px-1"
                  aria-label="上に移動"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveMenuItem(i, 1)}
                  disabled={i === menu.length - 1 || reorderingId !== null}
                  className="text-gray-400 disabled:opacity-20 leading-none px-1"
                  aria-label="下に移動"
                >
                  ▼
                </button>
              </div>
              <input
                value={menuNameDrafts[m.id] ?? m.name}
                onChange={(e) => setMenuNameDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1 text-sm text-gray-300"
              />
              <span className="text-xs text-gray-500 shrink-0">
                ¥{m.price.toLocaleString()}
                {m.course_minutes != null && ` ・⏱${m.course_minutes}分`}
              </span>
              <button
                onClick={() => toggleCastDrink(m)}
                title="キャストドリンク（ドリンクバック対象）"
                className={`text-xs rounded-md border px-2 py-1 shrink-0 ${
                  m.is_cast_drink ? "border-gold text-gold bg-gold/10" : "border-line text-gray-500"
                }`}
              >
                🍾
              </button>
              <button
                onClick={() => saveMenuName(m.id)}
                disabled={(menuNameDrafts[m.id] ?? m.name) === m.name}
                className="text-xs rounded-md border border-line px-2 py-1 text-gray-300 disabled:opacity-40 shrink-0"
              >
                保存
              </button>
              <button onClick={() => removeMenuItem(m.id)} className="text-rose text-xs shrink-0">
                削除
              </button>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-dashed border-line p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="品名"
              className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
            <input
              value={menuPrice}
              onChange={(e) => setMenuPrice(e.target.value)}
              placeholder="金額"
              inputMode="numeric"
              className="w-20 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
            <input
              value={menuCourseMinutes}
              onChange={(e) => setMenuCourseMinutes(e.target.value)}
              placeholder="コース分(任意)"
              inputMode="numeric"
              className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={menuIsCastDrink}
                onChange={(e) => setMenuIsCastDrink(e.target.checked)}
              />
              🍾 キャストドリンク（ドリンクバック対象）
            </label>
            <button
              onClick={addMenuItem}
              className="rounded-md px-3 py-1.5 text-sm border border-dashed border-gold text-gold shrink-0"
            >
              ＋ 追加
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          「コース分」は飲み放題など時間制メニュー用です。設定すると、営業タブでこのメニューをタップした瞬間に伝票へタイマーがセットされます
        </div>
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">スタッフ管理</div>
        <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
          {staff.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6">
              スタッフが未登録です（「スタッフ」タブから追加できます）
            </div>
          )}
          {staff.map((s) => (
            <div key={s.id} className="flex justify-between items-center px-3 py-2 text-sm gap-2">
              <span className="text-gray-300 shrink-0">{s.name}</span>
              <input
                value={wageDrafts[s.id] ?? ""}
                onChange={(e) => setWageDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                placeholder="時給(任意)"
                inputMode="numeric"
                className="w-24 rounded-md bg-bg2 border border-line px-2 py-1 text-sm"
              />
              <button
                onClick={() => saveWage(s.id)}
                disabled={(wageDrafts[s.id] ?? "") === (s.hourly_wage != null ? String(s.hourly_wage) : "")}
                className="text-xs rounded-md border border-line px-2 py-1 text-gray-300 disabled:opacity-40 shrink-0"
              >
                保存
              </button>
              <button onClick={() => removeStaff(s.id)} className="text-rose text-xs shrink-0">
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
