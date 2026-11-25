import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  return { supabase };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const auth = await adminClient();
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase!
    .from("title_reviews")
    .select("id, title_id, user_id, rating, body, status, created_at, profiles!title_reviews_profile_fk(display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: "Unable to load the moderation queue." }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const auth = await adminClient();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  const { id, status } = payload as Record<string, unknown>;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ error: "Choose a valid review and moderation status." }, { status: 400 });
  }
  const { data, error } = await auth.supabase!
    .from("title_reviews")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update this review." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This review is no longer pending." }, { status: 409 });
  return NextResponse.json({ updated: true, status });
}
