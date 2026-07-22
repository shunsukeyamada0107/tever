import { NextResponse, type NextRequest } from "next/server";
import { createWritableServerSupabaseClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = createWritableServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type: type as "magiclink", token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
