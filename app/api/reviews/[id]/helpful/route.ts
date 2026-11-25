import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community features are not configured yet." }, { status: 503 });
  const ids = (request.nextUrl.searchParams.get("reviewIds") || "").split(",").filter(Boolean);
  if (!ids.length || ids.length > 100 || ids.some(id => !uuidPattern.test(id))) return NextResponse.json({ error: "Provide up to 100 valid review IDs." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("get_review_helpful_counts", { p_review_ids: ids });
  if (error) return NextResponse.json({ error: "Unable to load helpful votes." }, { status: 500 });
  return NextResponse.json({ votes: data ?? [], signedIn: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community features are not configured yet." }, { status: 503 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to vote for a review." }, { status: 401 });
  const { data, error } = await supabase.rpc("toggle_review_helpful_vote", { p_review_id: id });
  if (error?.code === "42501") return NextResponse.json({ error: "You cannot vote for this review." }, { status: 403 });
  if (error?.code === "P0002") return NextResponse.json({ error: "This review is no longer available." }, { status: 404 });
  if (error) return NextResponse.json({ error: "Unable to record your vote." }, { status: 500 });
  return NextResponse.json(data);
}
