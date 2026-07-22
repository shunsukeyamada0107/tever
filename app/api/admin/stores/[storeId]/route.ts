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

export async function DELETE(_request: Request, { params }: { params: { storeId: string } }) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { storeId } = params;
  const admin = createAdminSupabaseClient();

  const { data: members, error: membersError } = await admin
    .from("store_members")
    .select("user_id")
    .eq("store_id", storeId);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  for (const member of members ?? []) {
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(member.user_id);
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
    }
  }

  const { error: deleteStoreError } = await admin.from("stores").delete().eq("id", storeId);
  if (deleteStoreError) {
    return NextResponse.json({ error: deleteStoreError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
