import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ルートハンドラー等、サーバー側でログイン中ユーザーを確認するためのクライアント
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // ルートハンドラーからはレスポンスにcookieを書き戻さない（読み取り専用で使用）
        },
      },
    }
  );
}

// セッションを新しく発行する場合（ログイン切り替えなど）に使う、cookie書き込み可能なクライアント
export function createWritableServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}
