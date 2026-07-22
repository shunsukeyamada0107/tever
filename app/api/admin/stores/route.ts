import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { isOperatorEmail } from "@/lib/operator";

export const runtime = "nodejs";

async function requireOperator() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isOperatorEmail(user?.email) ? user : null;
}

export async function GET() {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("stores")
    .select("id, name, plan, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stores: data });
}

export async function POST(request: Request) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!storeName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "店舗名・メールアドレス・6文字以上のパスワードを入力してください。" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { store_name: storeName },
  });

  if (createError || !created.user) {
    const message = createError?.message.includes("already been registered")
      ? "このメールアドレスは既に登録されています。"
      : createError?.message ?? "アカウント作成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // auth.usersへのINSERTでDBトリガーが発火し、storesとstore_membersが自動作成される
  const { data: membership, error: membershipError } = await admin
    .from("store_members")
    .select("store_id")
    .eq("user_id", created.user.id)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "アカウントは作成されましたが、店舗情報の取得に失敗しました。Supabase側を確認してください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    storeId: membership.store_id,
    storeName,
    ownerEmail: email,
  });
}
