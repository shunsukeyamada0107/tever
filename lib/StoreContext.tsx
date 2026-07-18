"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type StoreContextValue = {
  storeId: string | null;
  storeName: string | null;
  loading: boolean;
};

const StoreContext = createContext<StoreContextValue>({
  storeId: null,
  storeName: null,
  loading: true,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        .select("store_id, stores(name)")
        .eq("user_id", userData.user.id)
        .limit(1)
        .single();

      if (member) {
        setStoreId(member.store_id);
        // @ts-expect-error supabase joined type
        setStoreName(member.stores?.name ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <StoreContext.Provider value={{ storeId, storeName, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
