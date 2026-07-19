"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/StoreContext";
import { BusinessDateProvider } from "@/lib/BusinessDateContext";

const TABS = [
  { href: "/dashboard", label: "営業" },
  { href: "/dashboard/staff", label: "スタッフ" },
  { href: "/dashboard/expenses", label: "経費" },
  { href: "/dashboard/report", label: "集計" },
  { href: "/dashboard/settings", label: "設定" },
];

function HeaderBar() {
  const { storeName, loading } = useStore();
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-bg2/90 backdrop-blur px-4 py-3">
      <div className="text-gold font-bold text-sm tracking-wide">
        {loading ? "読み込み中..." : storeName ?? "店舗未設定"}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <StoreProvider>
      <BusinessDateProvider>
        <div className="min-h-screen pb-20">
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
