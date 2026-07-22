"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { DEFAULT_TAX_RATE, DEFAULT_COMMISSION_RATE, DEFAULT_BUSINESS_DAY_CUTOFF_HOUR } from "@/lib/types";

type StoreContextValue = {
  storeId: string | null;
  storeName: string | null;
  taxRate: number;
  commissionRate: number;
  cutoffHour: number;
  reportTemplate: string | null;
  cashFloatAmount: number;
  loading: boolean;
  reload: () => void;
};

const StoreContext = createContext<StoreContextValue>({
  storeId: null,
  storeName: null,
  taxRate: DEFAULT_TAX_RATE,
  commissionRate: DEFAULT_COMMISSION_RATE,
  cutoffHour: DEFAULT_BUSINESS_DAY_CUTOFF_HOUR,
  reportTemplate: null,
  cashFloatAmount: 0,
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
          "store_id, stores(name, tax_rate, commission_rate, business_day_cutoff_hour, report_template, cash_float_amount)"
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
        };
        const stores = member.stores as unknown as StoreRow | StoreRow[] | null;
        const store = Array.isArray(stores) ? stores[0] : stores;
        setStoreName(store?.name ?? null);
        setTaxRate(store?.tax_rate ?? DEFAULT_TAX_RATE);
        setCommissionRate(store?.commission_rate ?? DEFAULT_COMMISSION_RATE);
        setCutoffHour(store?.business_day_cutoff_hour ?? DEFAULT_BUSINESS_DAY_CUTOFF_HOUR);
        setReportTemplate(store?.report_template ?? null);
        setCashFloatAmount(store?.cash_float_amount ?? 0);
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
