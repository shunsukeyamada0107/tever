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
      <div className="sticky top-0 z-10 border-b border-line bg-bg2/80 backdrop-blur-xl px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
            <span className="font-bold text-[15px] tracking-tight">組織ダッシュボード</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 border border-line rounded-lg px-2.5 py-1.5 hover:text-gray-200 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
      <main className="p-4">{children}</main>
    </div>
  );
}
