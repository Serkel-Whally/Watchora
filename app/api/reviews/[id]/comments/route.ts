import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, context: Context) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 });
  const { id } = await context.params;
  if (!uuid.test(id)) return NextResponse.json({ error: "Choose a valid review." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("review_comments")
    .select("id, review_id, author_id, parent_id, body, contains_spoilers, status, created_at, profiles!review_comments_author_id_fkey(display_name)")
    .eq("review_id", id).order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Unable to load this discussion." }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: Context) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 });
  const { id } = await context.params;
  if (!uuid.test(id)) return NextResponse.json({ error: "Choose a valid review." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to join the discussion." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  const body = typeof value.body === "string" ? value.body.trim() : "";
  const parentId = value.parentId === null || value.parentId === undefined || value.parentId === "" ? null : value.parentId;
  if (body.length < 2 || body.length > 600) return NextResponse.json({ error: "Comments must be between 2 and 600 characters." }, { status: 400 });
  if (parentId !== null && (typeof parentId !== "string" || !uuid.test(parentId))) return NextResponse.json({ error: "Choose a valid comment to reply to." }, { status: 400 });
  const { data, error } = await supabase.from("review_comments").insert({
    review_id: id, author_id: user.id, parent_id: parentId,
    body, contains_spoilers: value.containsSpoilers === true, status: "pending",
  }).select("id").single();
  if (error?.code === "42501" || error?.code === "23503" || error?.code === "23514") return NextResponse.json({ error: "This discussion is unavailable for replies, or the parent comment is no longer public." }, { status: 400 });
  if (error) return NextResponse.json({ error: "Your comment could not be submitted." }, { status: 500 });
  return NextResponse.json({ id: data.id, status: "pending" }, { status: 201 });
}
