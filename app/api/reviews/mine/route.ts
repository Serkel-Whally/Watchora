import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community reviews are not configured yet." }, { status: 503 });
  const titleId = Number(request.nextUrl.searchParams.get("titleId"));
  if (!Number.isSafeInteger(titleId) || titleId < 1) return NextResponse.json({ error: "A valid title is required." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ review: null });
  const { data, error } = await supabase.from("title_reviews")
    .select("id, rating, body, status, created_at")
    .eq("title_id", titleId).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load your review." }, { status: 500 });
  return NextResponse.json({ review: data });
}
