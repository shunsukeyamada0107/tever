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

export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "メールアドレス・6文字以上のパスワードを入力してください。" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", params.orgId)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: "組織が見つかりません。" }, { status: 404 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // account_type='organization' により、DBトリガー側で店舗の自動作成をスキップする
    user_metadata: { account_type: "organization", organization_id: org.id },
  });

  if (createError || !created.user) {
    const message = createError?.message.includes("already been registered")
      ? "このメールアドレスは既に登録されています。"
      : createError?.message ?? "アカウント作成に失敗しました。";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: created.user.id });
  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ organizationName: org.name, loginEmail: email });
}
