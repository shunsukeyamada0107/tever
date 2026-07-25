"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      return;
    }

    const { data: storeMember } = await supabase
      .from("store_members")
      .select("store_id")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();

    if (storeMember) {
      router.push("/dashboard");
      return;
    }

    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();

    setLoading(false);
    router.push(orgMember ? "/org" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-bg2 border border-line rounded-xl p-6 space-y-4"
      >
        <h1 className="text-gold text-lg font-bold">Your Manager ログイン</h1>
        <div>
          <label className="block text-xs text-gray-400 mb-1">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">パスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-bg border border-line px-3 py-2"
          />
        </div>
        {error && <p className="text-rose text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gold text-bg font-bold py-2 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
        <p className="text-xs text-gray-500">
          ※ アカウントは運営がお店ごとに発行します
        </p>
      </form>
    </main>
  );
}
