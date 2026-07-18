"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import { MenuItem, Staff } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const { storeId } = useStore();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [wageDrafts, setWageDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data: menuData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: true });
    setMenu(menuData ?? []);

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
    await supabase.from("menu_items").insert({
      store_id: storeId,
      name: menuName.trim(),
      price: Number(menuPrice),
    });
    setMenuName("");
    setMenuPrice("");
    loadData();
  }

  async function removeMenuItem(id: string) {
    await supabase.from("menu_items").update({ active: false }).eq("id", id);
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

  return (
    <div className="space-y-6">
      <div>
        <div className="text-gold font-bold text-sm mb-2">メニュー管理</div>
        <div className="rounded-xl border border-line bg-elevated divide-y divide-line mb-2">
          {menu.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6">メニューが未登録です</div>
          )}
          {menu.map((m) => (
            <div key={m.id} className="flex justify-between items-center px-3 py-2 text-sm">
              <span className="text-gray-300">
                {m.name}・¥{m.price.toLocaleString()}
              </span>
              <button onClick={() => removeMenuItem(m.id)} className="text-rose text-xs">
                削除
              </button>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-dashed border-line p-3 flex gap-2">
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
            className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          />
          <button
            onClick={addMenuItem}
            className="rounded-md px-3 py-1.5 text-sm border border-dashed border-gold text-gold shrink-0"
          >
            ＋ 追加
          </button>
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
