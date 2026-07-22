"use client";

import { useEffect, useState } from "react";

type StoreRow = {
  id: string;
  name: string;
  plan: string;
  created_at: string;
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function AdminPage() {
  const [stores, setStores] = useState<StoreRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ storeName: string; ownerEmail: string; password: string } | null>(null);

  async function loadStores() {
    setListError(null);
    const res = await fetch("/api/admin/stores");
    const body = await res.json();
    if (!res.ok) {
      setListError(body.error ?? "店舗一覧の取得に失敗しました。");
      return;
    }
    setStores(body.stores);
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setCreated(null);

    const res = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, email, password }),
    });
    const body = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setFormError(body.error ?? "作成に失敗しました。");
      return;
    }

    setCreated({ storeName: body.storeName, ownerEmail: body.ownerEmail, password });
    setStoreName("");
    setEmail("");
    setPassword(generatePassword());
    loadStores();
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto space-y-8">
      <h1 className="text-gold text-lg font-bold">店舗管理（運営用）</h1>

      <form onSubmit={handleCreate} className="bg-bg2 border border-line rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-200">新しい店舗を作成</h2>
        <div>
          <label className="block text-xs text-gray-400 mb-1">店舗名</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">オーナーのメールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">初期パスワード</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 rounded-md bg-bg border border-line px-3 py-2 font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="text-xs text-gray-400 border border-line rounded-md px-3"
            >
              再生成
            </button>
          </div>
        </div>
        {formError && <p className="text-rose text-sm">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gold text-bg font-bold py-2 disabled:opacity-50"
        >
          {submitting ? "作成中..." : "店舗を作成する"}
        </button>
      </form>

      {created && (
        <div className="bg-bg2 border border-gold rounded-xl p-4 space-y-1 text-sm">
          <p className="text-gold font-bold">作成しました</p>
          <p>店舗名: {created.storeName}</p>
          <p>ログイン用メール: {created.ownerEmail}</p>
          <p>
            初期パスワード: <span className="font-mono">{created.password}</span>
          </p>
          <p className="text-xs text-gray-500">このパスワードは今だけ表示されます。店舗オーナーに伝えてください。</p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-200">登録済みの店舗</h2>
        {listError && <p className="text-rose text-sm">{listError}</p>}
        {!stores && !listError && <p className="text-xs text-gray-500">読み込み中...</p>}
        {stores && stores.length === 0 && <p className="text-xs text-gray-500">まだ店舗がありません。</p>}
        {stores && stores.length > 0 && (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
            {stores.map((s) => (
              <li key={s.id} className="px-4 py-3 bg-bg2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(s.created_at).toLocaleDateString("ja-JP")} ・ {s.plan}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
