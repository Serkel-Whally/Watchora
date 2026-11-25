import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

export const dynamic = "force-dynamic";

async function getMember() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Watchlist sync is not configured." }, { status: 503 });
  const { supabase, user } = await getMember();
  if (!user) return NextResponse.json({ error: "Sign in to sync your watchlist." }, { status: 401 });
  const { data, error } = await supabase.from("user_watchlist").select("title_id").order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Unable to load your saved titles." }, { status: 500 });
  const titleIds = (data ?? []).map((row) => Number(row.title_id)).filter((id) => getCatalogueProvider().getById(id));
  return NextResponse.json({ titleIds }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Watchlist sync is not configured." }, { status: 503 });
  const { supabase, user } = await getMember();
  if (!user) return NextResponse.json({ error: "Sign in to sync your watchlist." }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid watchlist." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  const rawIds = Array.isArray(value.titleIds) ? value.titleIds : [value.titleId];
  if (rawIds.length > 500) return NextResponse.json({ error: "A watchlist can contain up to 500 titles." }, { status: 400 });
  const titleIds = Array.from(new Set(rawIds.map(Number)));
  if (titleIds.some((id) => !Number.isSafeInteger(id) || id < 1 || !getCatalogueProvider().getById(id))) {
    return NextResponse.json({ error: "One or more saved titles are invalid." }, { status: 400 });
  }
  const { data: existingRows, error: existingError } = await supabase.from("user_watchlist").select("title_id").limit(501);
  if (existingError) return NextResponse.json({ error: "Unable to check your saved titles." }, { status: 500 });
  const combinedIds = new Set([...(existingRows ?? []).map((row) => Number(row.title_id)), ...titleIds]);
  if (combinedIds.size > 500) return NextResponse.json({ error: "A watchlist can contain up to 500 titles." }, { status: 400 });
  if (titleIds.length) {
    const rows = titleIds.map((title_id) => ({ user_id: user.id, title_id }));
    const { error } = await supabase.from("user_watchlist").upsert(rows, { onConflict: "user_id,title_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "Unable to save your titles." }, { status: 500 });
  }
  const { data, error } = await supabase.from("user_watchlist").select("title_id").order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Unable to confirm your saved titles." }, { status: 500 });
  return NextResponse.json({ titleIds: (data ?? []).map((row) => Number(row.title_id)) });
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Watchlist sync is not configured." }, { status: 503 });
  const { supabase, user } = await getMember();
  if (!user) return NextResponse.json({ error: "Sign in to sync your watchlist." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid watchlist request." }, { status: 400 });
  const titleId = Number((payload as Record<string, unknown>).titleId);
  if (!Number.isSafeInteger(titleId) || titleId < 1 || !getCatalogueProvider().getById(titleId)) return NextResponse.json({ error: "Choose a valid title." }, { status: 400 });
  const { error } = await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("title_id", titleId);
  if (error) return NextResponse.json({ error: "Unable to remove this title." }, { status: 500 });
  return NextResponse.json({ success: true });
}
