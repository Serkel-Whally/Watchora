import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function memberClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Notifications are not configured yet." }, { status: 503 });
  const { supabase, user } = await memberClient();
  if (!user) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const { data, error } = await supabase.from("member_notifications")
    .select("id, actor_id, notification_type, title_id, review_id, created_at, read_at")
    .order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  const actorIds = Array.from(new Set((data ?? []).map((item) => item.actor_id).filter((id): id is string => Boolean(id))));
  const { data: profiles } = actorIds.length ? await supabase.from("profiles").select("id, display_name").in("id", actorIds) : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const notifications = (data ?? []).map((item) => ({ ...item, actor_name: item.actor_id ? names.get(item.actor_id) ?? "A Watchora member" : null }));
  return NextResponse.json({ notifications, unreadCount: notifications.filter((item) => !item.read_at).length }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Notifications are not configured yet." }, { status: 503 });
  const { supabase, user } = await memberClient();
  if (!user) return NextResponse.json({ error: "Sign in to manage notifications." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid notification request." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  const ids = Array.isArray(value.ids) ? value.ids : [];
  if (value.all === true) {
    const { error } = await supabase.from("member_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    if (error) return NextResponse.json({ error: "Unable to mark notifications as read." }, { status: 500 });
    return NextResponse.json({ updated: true });
  }
  if (!ids.length || ids.length > 50 || ids.some((id) => typeof id !== "string" || id.length > 64)) {
    return NextResponse.json({ error: "Choose one or more valid notifications." }, { status: 400 });
  }
  const { error } = await supabase.from("member_notifications").update({ read_at: new Date().toISOString() }).in("id", ids).is("read_at", null);
  if (error) return NextResponse.json({ error: "Unable to mark notifications as read." }, { status: 500 });
  return NextResponse.json({ updated: true });
}
