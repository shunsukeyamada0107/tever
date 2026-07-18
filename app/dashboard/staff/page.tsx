"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import {
  Staff,
  Attendance,
  TabWithItems,
  businessDateFor,
  attHours,
  staffCommissionBreakdown,
} from "@/lib/types";

export default function StaffPage() {
  const supabase = createClient();
  const { storeId, taxRate, commissionRate, cutoffHour } = useStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tabs, setTabs] = useState<TabWithItems[]>([]);
  const [newName, setNewName] = useState("");
  const [newWage, setNewWage] = useState("");
  const [now, setNow] = useState(Date.now());
  const businessDate = businessDateFor(new Date(), cutoffHour);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: true });
    setStaff(staffData ?? []);

    const { data: attData } = await supabase
      .from("attendance")
      .select("*")
      .eq("store_id", storeId)
      .eq("business_date", businessDate)
      .order("clock_in", { ascending: false });
    setAttendance(attData ?? []);

    const { data: tabsData } = await supabase
      .from("tabs")
      .select("*, tab_items(*)")
      .eq("store_id", storeId)
      .eq("business_date", businessDate);
    setTabs((tabsData as TabWithItems[]) ?? []);
  }, [storeId, businessDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 経過時間表示を更新するための1分ごとの再描画
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  function staffName(staffId: string | null) {
    if (!staffId) return "未設定";
    const s = staff.find((x) => x.id === staffId);
    return s ? s.name : "(元スタッフ)";
  }

  const commission = staffCommissionBreakdown(tabs, staffName, taxRate, commissionRate);

  function openAttendanceFor(staffId: string) {
    return attendance.find((a) => a.staff_id === staffId && !a.clock_out);
  }

  async function clockIn(s: Staff) {
    if (!storeId) return;
    await supabase.from("attendance").insert({
      store_id: storeId,
      staff_id: s.id,
      business_date: businessDate,
      clock_in: new Date().toISOString(),
      wage_snapshot: s.hourly_wage,
    });
    loadData();
  }

  async function clockOut(s: Staff) {
    const rec = openAttendanceFor(s.id);
    if (!rec) return;
    await supabase
      .from("attendance")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", rec.id);
    loadData();
  }

  async function deleteAttendance(id: string) {
    await supabase.from("attendance").delete().eq("id", id);
    loadData();
  }

  async function addStaff() {
    if (!storeId || !newName.trim()) return;
    const wage = newWage.trim() === "" ? null : Number(newWage);
    await supabase.from("staff").insert({
      store_id: storeId,
      name: newName.trim(),
      hourly_wage: wage,
    });
    setNewName("");
    setNewWage("");
    loadData();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-gold font-bold text-sm mb-2">出退勤</div>
        {staff.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl mb-3">
            スタッフが未登録です。下のフォームから追加してください
          </div>
        )}
        <div className="space-y-2">
          {staff.map((s) => {
            const open = openAttendanceFor(s.id);
            const elapsed = open ? attHours(open, now) : 0;
            const h = Math.floor(elapsed);
            const mm = Math.round((elapsed - h) * 60);
            const staffComm = commission.find((c) => c.staffId === s.id);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-line bg-elevated p-3 flex items-center gap-3"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${open ? "bg-gold" : "bg-line"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{s.name}</div>
                  <div className="text-xs text-gray-400">
                    {s.hourly_wage != null ? `時給 ¥${s.hourly_wage.toLocaleString()}` : "時給未設定"}・歩合
                    {Math.round(commissionRate * 100)}%
                  </div>
                  {open && (
                    <div className="text-xs text-gold mt-0.5">
                      勤務中 {h}h{String(mm).padStart(2, "0")}m
                    </div>
                  )}
                  {staffComm && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      本日の歩合 ¥{Math.round(staffComm.commission).toLocaleString()}
                    </div>
                  )}
                </div>
                {open ? (
                  <button
                    onClick={() => clockOut(s)}
                    className="text-xs rounded-md bg-rose text-white px-3 py-1.5 font-bold shrink-0"
                  >
                    退勤
                  </button>
                ) : (
                  <button
                    onClick={() => clockIn(s)}
                    className="text-xs rounded-md bg-gold text-bg px-3 py-1.5 font-bold shrink-0"
                  >
                    出勤
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-dashed border-line p-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="スタッフ名"
            className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          />
          <input
            value={newWage}
            onChange={(e) => setNewWage(e.target.value)}
            placeholder="時給(任意)"
            inputMode="numeric"
            className="w-24 rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          />
          <button
            onClick={addStaff}
            className="rounded-md px-3 py-1.5 text-sm border border-dashed border-gold text-gold shrink-0"
          >
            ＋ 追加
          </button>
        </div>
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">本日の勤怠記録</div>
        {attendance.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
            まだ記録がありません
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {attendance.map((a) => {
              const hrs = attHours(a, now);
              const inS = new Date(a.clock_in);
              const outS = a.clock_out ? new Date(a.clock_out) : null;
              return (
                <div key={a.id} className="flex justify-between items-center px-3 py-2 text-sm">
                  <span className="text-gray-300">
                    {staffName(a.staff_id)}{" "}
                    {inS.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜
                    {outS
                      ? outS.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                      : "勤務中"}
                  </span>
                  <span className="font-mono text-gray-400 flex items-center gap-2">
                    {hrs.toFixed(1)}h /{" "}
                    {a.wage_snapshot != null ? `¥${Math.round(hrs * a.wage_snapshot).toLocaleString()}` : "時給未設定"}
                    <button onClick={() => deleteAttendance(a.id)} className="text-rose">
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
