import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createAdminSupabaseClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { storeId: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // 呼び出し元が本部アカウントとして所属する組織を確認する（他組織の店舗に入れないようここで絞る）
  const { data: membership, error: memErr } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (memErr || !membership) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { data: store, error: storeError } = await admin
    .from("stores")
    .select("id, organization_id")
    .eq("id", params.storeId)
    .single();
  if (storeError || !store || store.organization_id !== membership.organization_id) {
    return NextResponse.json({ error: "この店舗には入れません。" }, { status: 403 });
  }

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
