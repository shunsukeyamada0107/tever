"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_BUSINESS_DAY_CUTOFF_HOUR,
  DEFAULT_DRINK_BACK_AMOUNT,
  CommissionScheme,
} from "@/lib/types";
import { StoreTheme } from "@/lib/theme";

type StoreContextValue = {
  storeId: string | null;
  storeName: string | null;
  taxRate: number;
  commissionRate: number;
  cutoffHour: number;
  reportTemplate: string | null;
  cashFloatAmount: number;
  accentColor: string;
  commissionScheme: CommissionScheme;
  drinkBackAmount: number;
  theme: StoreTheme;
  loading: boolean;
  reload: () => void;
};

const DEFAULT_ACCENT_COLOR = "#DCA84E";

const StoreContext = createContext<StoreContextValue>({
  storeId: null,
  storeName: null,
  taxRate: DEFAULT_TAX_RATE,
  commissionRate: DEFAULT_COMMISSION_RATE,
  cutoffHour: DEFAULT_BUSINESS_DAY_CUTOFF_HOUR,
  reportTemplate: null,
  cashFloatAmount: 0,
  accentColor: DEFAULT_ACCENT_COLOR,
  commissionScheme: "simple",
  drinkBackAmount: DEFAULT_DRINK_BACK_AMOUNT,
  theme: "dark",
  loading: true,
  reload: () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);
  const [cutoffHour, setCutoffHour] = useState(DEFAULT_BUSINESS_DAY_CUTOFF_HOUR);
  const [reportTemplate, setReportTemplate] = useState<string | null>(null);
  const [cashFloatAmount, setCashFloatAmount] = useState(0);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [commissionScheme, setCommissionScheme] = useState<CommissionScheme>("simple");
  const [drinkBackAmount, setDrinkBackAmount] = useState(DEFAULT_DRINK_BACK_AMOUNT);
  const [theme, setTheme] = useState<StoreTheme>("dark");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }
      // ログインユーザーが所属する店舗を1件取得（今は1ユーザー1店舗の想定）
      const { data: member } = await supabase
        .from("store_members")
        .select(
          "store_id, stores(name, tax_rate, commission_rate, business_day_cutoff_hour, report_template, cash_float_amount, accent_color, commission_scheme, drink_back_amount, theme)"
        )
        .eq("user_id", userData.user.id)
        .limit(1)
        .single();

      if (member) {
        setStoreId(member.store_id);
        type StoreRow = {
          name: string;
          tax_rate: number;
          commission_rate: number;
          business_day_cutoff_hour: number;
          report_template: string | null;
          cash_float_amount: number;
          accent_color: string | null;
          commission_scheme: CommissionScheme | null;
          drink_back_amount: number | null;
          theme: StoreTheme | null;
        };
        const stores = member.stores as unknown as StoreRow | StoreRow[] | null;
        const store = Array.isArray(stores) ? stores[0] : stores;
        setStoreName(store?.name ?? null);
        setTaxRate(store?.tax_rate ?? DEFAULT_TAX_RATE);
        setCommissionRate(store?.commission_rate ?? DEFAULT_COMMISSION_RATE);
        setCutoffHour(store?.business_day_cutoff_hour ?? DEFAULT_BUSINESS_DAY_CUTOFF_HOUR);
        setReportTemplate(store?.report_template ?? null);
        setCashFloatAmount(store?.cash_float_amount ?? 0);
        setAccentColor(store?.accent_color ?? DEFAULT_ACCENT_COLOR);
        setCommissionScheme(store?.commission_scheme ?? "simple");
        setDrinkBackAmount(store?.drink_back_amount ?? DEFAULT_DRINK_BACK_AMOUNT);
        setTheme(store?.theme ?? "dark");
      }
      setLoading(false);
    }
    load();
  }, [reloadKey]);

  return (
    <StoreContext.Provider
      value={{
        storeId,
        storeName,
        taxRate,
        commissionRate,
        cutoffHour,
        reportTemplate,
        cashFloatAmount,
        accentColor,
        commissionScheme,
        drinkBackAmount,
        theme,
        loading,
        reload,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
