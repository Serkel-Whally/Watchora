import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community follows are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your following feed." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_following_activity", { p_limit: 50 });
  if (error) return NextResponse.json({ error: "Unable to load your following feed." }, { status: 500 });
  return NextResponse.json({ activity: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
