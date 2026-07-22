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

export async function POST(_request: Request, { params }: { params: { storeId: string } }) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  const { data: owner, error: ownerError } = await admin
    .from("store_members")
    .select("user_id")
    .eq("store_id", params.storeId)
    .eq("role", "owner")
    .limit(1)
    .single();

  if (ownerError || !owner) {
    return NextResponse.json({ error: "この店舗のオーナーが見つかりません。" }, { status: 404 });
  }

  const { data: ownerUser, error: userError } = await admin.auth.admin.getUserById(owner.user_id);
  if (userError || !ownerUser.user?.email) {
    return NextResponse.json({ error: "オーナーのアカウント情報を取得できませんでした。" }, { status: 500 });
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerUser.user.email,
  });

  if (linkError || !link.properties?.hashed_token) {
    return NextResponse.json({ error: "ログインリンクの発行に失敗しました。" }, { status: 500 });
  }

  const url = `/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&next=/dashboard`;
  return NextResponse.json({ url });
}
