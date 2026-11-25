import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community follows are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to follow members." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const targetId = payload && typeof payload === "object" ? (payload as Record<string, unknown>).memberId : null;
  if (typeof targetId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
    return NextResponse.json({ error: "Choose a valid member." }, { status: 400 });
  }
  if (targetId === user.id) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", targetId).maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  const { error } = await supabase.from("member_follows").upsert({ follower_id: user.id, following_id: targetId }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Unable to follow this member." }, { status: 500 });
  return NextResponse.json({ following: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community follows are not configured yet." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage follows." }, { status: 401 });
  const targetId = request.nextUrl.searchParams.get("memberId");
  if (!targetId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
    return NextResponse.json({ error: "Choose a valid member." }, { status: 400 });
  }
  const { error } = await supabase.from("member_follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
  if (error) return NextResponse.json({ error: "Unable to unfollow this member." }, { status: 500 });
  return NextResponse.json({ following: false });
}
