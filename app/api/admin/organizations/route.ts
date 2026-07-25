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

  const { data: orgs, error: orgsError } = await admin
    .from("organizations")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });
  if (orgsError) {
    return NextResponse.json({ error: orgsError.message }, { status: 500 });
  }

  const { data: stores, error: storesError } = await admin
    .from("stores")
    .select("id, name, organization_id")
    .not("organization_id", "is", null);
  if (storesError) {
    return NextResponse.json({ error: storesError.message }, { status: 500 });
  }

  const { data: members, error: membersError } = await admin
    .from("organization_members")
    .select("organization_id, user_id");
  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const memberEmailByOrg: Record<string, string> = {};
  for (const m of members ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(m.user_id);
    if (u.user?.email) memberEmailByOrg[m.organization_id] = u.user.email;
  }

  const result = (orgs ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    created_at: org.created_at,
    stores: (stores ?? []).filter((s) => s.organization_id === org.id).map((s) => ({ id: s.id, name: s.name })),
    loginEmail: memberEmailByOrg[org.id] ?? null,
  }));

  return NextResponse.json({ organizations: result });
}

export async function POST(request: Request) {
  const user = await requireOperator();
  if (!user) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "組織名を入力してください。" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("organizations").insert({ name }).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
