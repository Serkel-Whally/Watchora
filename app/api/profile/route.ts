import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Accounts are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("id, display_name, bio, created_at").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 });
  return NextResponse.json({ profile: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Accounts are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  const displayName = typeof value.displayName === "string" ? value.displayName.trim().replace(/\s+/g, " ") : "";
  const bio = typeof value.bio === "string" ? value.bio.trim() : "";
  if (displayName.length < 2 || displayName.length > 40) return NextResponse.json({ error: "Display name must be 2–40 characters." }, { status: 400 });
  if (bio.length > 240) return NextResponse.json({ error: "Bio must be 240 characters or fewer." }, { status: 400 });
  const { data, error } = await supabase.from("profiles").update({ display_name: displayName, bio }).eq("id", user.id).select("id, display_name, bio, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to save your profile." }, { status: 500 });
  return NextResponse.json({ profile: data });
}
