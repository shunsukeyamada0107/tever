import { createClient } from "@supabase/supabase-js";

// service_role鍵を使う管理用クライアント（RLSを無視するのでサーバー側でのみ使用すること）
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
