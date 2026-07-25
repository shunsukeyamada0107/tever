"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-line bg-bg2/90 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-gold font-bold text-sm tracking-wide">組織ダッシュボード</div>
          <button onClick={handleLogout} className="text-xs text-gray-400 border border-line rounded-md px-2 py-1">
            ログアウト
          </button>
        </div>
      </div>
      <main className="p-4">{children}</main>
    </div>
  );
}
