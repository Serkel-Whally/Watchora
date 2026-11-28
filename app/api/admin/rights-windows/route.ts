import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function adminContext() {
  if (!isSupabaseConfigured()) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { response: NextResponse.json({ error: "Server-side admin database access is not configured." }, { status: 503 }) };
  return { db: createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }), user };
}

export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (context.response) return context.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid rights window." }, { status: 400 });
  const { mediaAssetId, territoryCode, startsAt, endsAt } = payload as Record<string, unknown>;
  const territory = typeof territoryCode === "string" ? territoryCode.toUpperCase() : "";
  const start = typeof startsAt === "string" ? new Date(startsAt) : null;
  const end = typeof endsAt === "string" && endsAt ? new Date(endsAt) : null;
  if (
    typeof mediaAssetId !== "string" || !/^[0-9a-f-]{36}$/i.test(mediaAssetId) ||
    !(territory === "WORLD" || /^[A-Z]{2}$/.test(territory)) ||
    !start || !Number.isFinite(start.getTime()) ||
    (endsAt !== null && endsAt !== undefined && endsAt !== "" && (!end || !Number.isFinite(end.getTime()) || end <= start))
  ) return NextResponse.json({ error: "Provide a valid asset, territory code and rights start/end dates." }, { status: 400 });

  const { data, error } = await context.db!
    .from("rights_windows")
    .insert({
      media_asset_id: mediaAssetId,
      territory_code: territory,
      starts_at: start.toISOString(),
      ends_at: end?.toISOString() ?? null,
      status: "draft",
      created_by: context.user!.id,
    })
    .select("id, media_asset_id, territory_code, starts_at, ends_at, status")
    .single();
  if (error?.code === "23503") return NextResponse.json({ error: "The selected media asset does not exist." }, { status: 404 });
  if (error) return NextResponse.json({ error: "Unable to create rights window." }, { status: 500 });
  return NextResponse.json({ rightsWindow: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const context = await adminContext();
  if (context.response) return context.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid rights update." }, { status: 400 });
  const { id, status } = payload as Record<string, unknown>;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || !["draft", "active", "suspended", "expired"].includes(String(status))) {
    return NextResponse.json({ error: "Choose a valid rights window and status." }, { status: 400 });
  }
  const { data, error } = await context.db!
    .from("rights_windows")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update rights status." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Rights window not found." }, { status: 404 });
  return NextResponse.json({ rightsWindow: data });
}
