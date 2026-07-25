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

export async function DELETE(_request: Request, { params }: { params: { orgId: string } }) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  // 本部アカウントのログインも一緒に削除する
  const { data: members, error: membersError } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", params.orgId);
  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }
  for (const m of members ?? []) {
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(m.user_id);
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
    }
  }

  // 所属店舗は削除せず、組織所属を解除するだけにする
  const { error: unlinkError } = await admin
    .from("stores")
    .update({ organization_id: null })
    .eq("organization_id", params.orgId);
  if (unlinkError) {
    return NextResponse.json({ error: unlinkError.message }, { status: 500 });
  }

  const { error: deleteOrgError } = await admin.from("organizations").delete().eq("id", params.orgId);
  if (deleteOrgError) {
    return NextResponse.json({ error: deleteOrgError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
