"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function SuspendedPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg2 border border-line rounded-xl p-6 space-y-3 text-center">
        <h1 className="text-gold text-lg font-bold">ご利用が停止されています</h1>
        <p className="text-sm text-gray-300">
          このアカウントは現在ご利用いただけません。お心当たりがない場合や再開をご希望の場合は、運営までご連絡ください。
        </p>
        <button
          onClick={handleLogout}
          className="w-full rounded-md border border-line py-2 text-sm text-gray-300"
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}
