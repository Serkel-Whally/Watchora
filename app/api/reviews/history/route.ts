import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community reviews are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your review history." }, { status: 401 });
  const { data, error } = await supabase.from("title_reviews")
    .select("id, title_id, rating, body, status, contains_spoilers, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load your review history." }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
