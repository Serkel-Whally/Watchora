import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  return { supabase };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const auth = await getAdmin();
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase!
    .from("review_reports")
    .select("id, review_id, reporter_id, reason, details, status, created_at, title_reviews!inner(title_id, body, rating, contains_spoilers, status)")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: "Unable to load review reports." }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const auth = await getAdmin();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid report action." }, { status: 400 });
  const { id, status } = payload as Record<string, unknown>;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || (status !== "resolved" && status !== "dismissed")) {
    return NextResponse.json({ error: "Choose a valid report and resolution." }, { status: 400 });
  }
  const { data, error } = await auth.supabase!
    .from("review_reports")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open")
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update this report." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This report is no longer open." }, { status: 409 });
  return NextResponse.json({ updated: true, status });
}
