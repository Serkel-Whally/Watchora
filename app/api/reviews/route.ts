import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community reviews are not configured yet." }, { status: 503 });
  const titleId = Number(request.nextUrl.searchParams.get("titleId"));
  if (!Number.isSafeInteger(titleId) || titleId < 1 || !getCatalogueProvider().getById(titleId)) {
    return NextResponse.json({ error: "A valid title is required." }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("title_reviews")
    .select("id, rating, body, created_at, user_id, profiles!title_reviews_profile_fk(display_name)")
    .eq("title_id", titleId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Unable to load reviews." }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community reviews are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit a review." }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  const titleId = Number(value.titleId);
  const rating = Number(value.rating);
  const body = typeof value.body === "string" ? value.body.trim() : "";
  if (!Number.isSafeInteger(titleId) || titleId < 1 || !getCatalogueProvider().getById(titleId)) return NextResponse.json({ error: "Choose a valid title." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  if (body.length < 12 || body.length > 1000) return NextResponse.json({ error: "Reviews must be between 12 and 1,000 characters." }, { status: 400 });

  const { data, error } = await supabase.from("title_reviews").insert({
    title_id: titleId, user_id: user.id, rating, body, status: "pending",
  }).select("id").single();
  if (error?.code === "23505") return NextResponse.json({ error: "You have already reviewed this title. Remove your existing review before submitting another." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Your review could not be submitted." }, { status: 500 });
  return NextResponse.json({ id: data.id, status: "pending" }, { status: 201 });
}
