"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/StoreContext";
import { BusinessDateProvider } from "@/lib/BusinessDateContext";
import { createClient } from "@/lib/supabaseClient";
import { hexToRgbTriplet } from "@/lib/types";
import { THEME_PRESETS } from "@/lib/theme";

const TABS = [
  { href: "/dashboard", label: "営業" },
  { href: "/dashboard/staff", label: "スタッフ" },
  { href: "/dashboard/expenses", label: "経費" },
  { href: "/dashboard/report", label: "集計" },
  { href: "/dashboard/settings", label: "設定" },
];

// 店舗ごとのブランドカラー・テーマ（明/暗）を、CSS変数として:rootに反映する
function ThemeStyle() {
  const { accentColor, theme } = useStore();
  const p = THEME_PRESETS[theme];
  return (
    <style>{`
      :root {
        --gold-rgb: ${hexToRgbTriplet(accentColor)};
        --bg2-rgb: ${p.bg2};
        --elevated-rgb: ${p.elevated};
        --line-rgb: ${p.line};
        --page-bg-rgb: ${p.pageBg};
        --page-text-rgb: ${p.pageText};
        --gray-200-rgb: ${p.gray200};
        --gray-300-rgb: ${p.gray300};
        --gray-400-rgb: ${p.gray400};
        --gray-500-rgb: ${p.gray500};
      }
    `}</style>
  );
}

function HeaderBar() {
  const router = useRouter();
  const supabase = createClient();
  const { storeName, loading } = useStore();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="sticky top-0 z-10 border-b border-line bg-bg2/90 backdrop-blur px-4 py-3 flex items-center justify-between">
      <div className="text-gold font-bold text-sm tracking-wide">
        {loading ? "読み込み中..." : storeName ?? "店舗未設定"}
      </div>
      <button onClick={handleLogout} className="text-xs text-gray-400 border border-line rounded-md px-2 py-1">
        ログアウト
      </button>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <StoreProvider>
      <BusinessDateProvider>
        <div className="min-h-screen pb-20">
          <ThemeStyle />
          <HeaderBar />
          <main className="p-4">{children}</main>
          <nav className="fixed bottom-0 left-0 right-0 flex border-t border-line bg-bg2/95 backdrop-blur">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center py-3 text-xs font-bold ${
                  pathname === tab.href ? "text-gold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </BusinessDateProvider>
    </StoreProvider>
  );
}
