"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useStore } from "@/lib/StoreContext";
import { useBusinessDate } from "@/lib/BusinessDateContext";
import { DateBar } from "@/lib/DateBar";
import { Expense, EXPENSE_CATEGORIES } from "@/lib/types";
import { parseReceiptText, ReceiptCandidate } from "@/lib/receiptParser";
import { preprocessReceiptImage } from "@/lib/receiptImage";

type Candidate = ReceiptCandidate & { checked: boolean };

export default function ExpensesPage() {
  const supabase = createClient();
  const { storeId } = useStore();
  const { date: businessDate } = useBusinessDate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("store_id", storeId)
      .eq("business_date", businessDate)
      .order("created_at", { ascending: false });
    setExpenses(data ?? []);
  }, [storeId, businessDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addExpense() {
    if (!storeId || !name.trim() || !amount.trim()) return;
    await supabase.from("expenses").insert({
      store_id: storeId,
      business_date: businessDate,
      category,
      name: name.trim(),
      amount: Number(amount),
    });
    setName("");
    setAmount("");
    loadData();
  }

  async function deleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    loadData();
  }

  async function handleReceiptFile(file: File) {
    setOcrError(null);
    setOcrLoading(true);
    setOcrProgress(0);
    setCandidates(null);
    try {
      const preprocessed = await preprocessReceiptImage(file);
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("jpn", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const result = await worker.recognize(preprocessed);
      await worker.terminate();
      const parsed = parseReceiptText(result.data.text);
      if (parsed.length === 0) {
        setOcrError("レシートから金額らしき項目を読み取れませんでした。手入力で追加してください。");
      } else {
        setCandidates(parsed.map((c) => ({ ...c, checked: true })));
      }
    } catch {
      setOcrError("読み取りに失敗しました。もう一度お試しください。");
    } finally {
      setOcrLoading(false);
    }
  }

  function updateCandidate(i: number, patch: Partial<Candidate>) {
    setCandidates((prev) => (prev ? prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) : prev));
  }

  function removeCandidate(i: number) {
    setCandidates((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function submitCandidates() {
    if (!storeId || !candidates) return;
    const toInsert = candidates.filter((c) => c.checked && c.name.trim() && c.amount > 0);
    if (toInsert.length === 0) return;
    await supabase.from("expenses").insert(
      toInsert.map((c) => ({
        store_id: storeId,
        business_date: businessDate,
        category: c.category,
        name: c.name.trim(),
        amount: c.amount,
      }))
    );
    setCandidates(null);
    loadData();
  }

  const total = expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-6">
      <DateBar />
      <div>
        <div className="text-gold font-bold text-sm mb-2">レシートから読み取る</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleReceiptFile(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ocrLoading}
          className="w-full rounded-xl border-2 border-dashed border-gold text-gold py-4 text-sm font-bold flex flex-col items-center gap-1 disabled:opacity-50"
        >
          <span className="text-2xl leading-none">📷</span>
          {ocrLoading ? `読み取り中... ${ocrProgress}%` : "レシートを撮影 / アップロード"}
        </button>
        {ocrError && <div className="text-xs text-rose mt-2">{ocrError}</div>}

        {candidates && (
          <div className="mt-3 rounded-xl border border-line bg-elevated p-3 space-y-2">
            <div className="text-xs text-gray-400">
              読み取り結果です。内容・金額・カテゴリを確認してから追加してください。
            </div>
            {candidates.map((c, i) => (
              <div key={i} className="flex items-center gap-2 border-t border-line pt-2 first:border-t-0 first:pt-0">
                <input
                  type="checkbox"
                  checked={c.checked}
                  onChange={(e) => updateCandidate(i, { checked: e.target.checked })}
                  className="shrink-0"
                />
                <select
                  value={c.category}
                  onChange={(e) => updateCandidate(i, { category: e.target.value })}
                  className="rounded-md bg-bg2 border border-line px-1.5 py-1 text-xs shrink-0 w-20"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  value={c.name}
                  onChange={(e) => updateCandidate(i, { name: e.target.value })}
                  className="flex-1 min-w-0 rounded-md bg-bg2 border border-line px-2 py-1 text-sm"
                />
                <input
                  value={c.amount}
                  onChange={(e) => updateCandidate(i, { amount: Number(e.target.value) || 0 })}
                  inputMode="numeric"
                  className="w-20 rounded-md bg-bg2 border border-line px-2 py-1 text-sm text-right"
                />
                <button onClick={() => removeCandidate(i)} className="text-rose shrink-0">
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCandidates(null)}
                className="flex-1 rounded-md border border-line py-2 text-sm text-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={submitCandidates}
                className="flex-1 rounded-md bg-gold text-bg py-2 text-sm font-bold"
              >
                選択した項目を追加
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="text-gold font-bold text-sm mb-2">経費を追加（手入力）</div>
        <div className="rounded-xl border border-line bg-elevated p-3 space-y-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="内容（例：氷 5袋）"
            className="w-full rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額（円）"
            inputMode="numeric"
            className="w-full rounded-md bg-bg2 border border-line px-2 py-1.5 text-sm"
          />
          <button
            onClick={addExpense}
            className="w-full rounded-md bg-gold text-bg px-3 py-2 text-sm font-bold"
          >
            追加する
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-gold font-bold text-sm">{businessDate}の経費</div>
          <div className="text-sm font-mono text-gray-300">計 ¥{total.toLocaleString()}</div>
        </div>
        {expenses.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-line rounded-xl">
            まだ記録がありません
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated divide-y divide-line">
            {expenses.map((e) => (
              <div key={e.id} className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-xs rounded bg-bg2 border border-line px-1.5 py-0.5 shrink-0">
                    {e.category}
                  </span>
                  <span className="text-gray-300 truncate">{e.name}</span>
                </span>
                <span className="font-mono text-gray-400 flex items-center gap-2 shrink-0">
                  -¥{e.amount.toLocaleString()}
                  <button onClick={() => deleteExpense(e.id)} className="text-rose">
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
