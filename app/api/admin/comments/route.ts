import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const { data, error } = await auth.supabase!.from("review_comments")
    .select("id, review_id, author_id, parent_id, body, contains_spoilers, created_at, profiles!review_comments_author_id_fkey(display_name), title_reviews!review_comments_review_id_fkey!inner(title_id, body, rating)")
    .eq("status", "pending").order("created_at", { ascending: true }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load pending comments." }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const auth = await adminClient();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  const { id, status } = payload as Record<string, unknown>;
  if (typeof id !== "string" || !uuid.test(id) || (status !== "approved" && status !== "rejected")) return NextResponse.json({ error: "Choose a valid comment and moderation status." }, { status: 400 });
  const { data, error } = await auth.supabase!.from("review_comments").update({ status }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update this comment." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This comment is no longer pending." }, { status: 409 });
  return NextResponse.json({ updated: true, status });
}
