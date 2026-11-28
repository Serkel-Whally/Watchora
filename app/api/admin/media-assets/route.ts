import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { films } from "@/lib/catalogue";
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

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { db, user };
}

export async function GET() {
  const context = await adminContext();
  if (context.response) return context.response;
  const { data, error } = await context.db!
    .from("media_assets")
    .select("id, title_id, provider, provider_asset_id, status, created_at, updated_at, rights_windows(id, territory_code, starts_at, ends_at, status)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Unable to load media inventory. Apply the streaming foundation migration first." }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (context.response) return context.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid media asset." }, { status: 400 });
  const { titleId, provider, providerAssetId, status } = payload as Record<string, unknown>;
  if (
    typeof titleId !== "number" || !Number.isSafeInteger(titleId) || titleId <= 0 ||
    typeof provider !== "string" || !/^[a-zA-Z0-9 _.-]{2,80}$/.test(provider.trim()) ||
    typeof providerAssetId !== "string" || providerAssetId.trim().length < 2 || providerAssetId.trim().length > 200 ||
    (status !== undefined && status !== "pending" && status !== "processing" && status !== "ready" && status !== "failed" && status !== "disabled")
  ) return NextResponse.json({ error: "Choose a catalogue title and enter a valid provider, provider asset ID and status." }, { status: 400 });

  if (titleId > 1_000_000_000) {
    const studioId = titleId - 1_000_000_000;
    const { data: studioTitle, error: titleError } = await context.db!
      .from("content_catalogue").select("id").eq("id", studioId).maybeSingle();
    if (titleError) return NextResponse.json({ error: "Unable to verify the selected Studio title." }, { status: 500 });
    if (!studioTitle) return NextResponse.json({ error: "The selected Studio title does not exist." }, { status: 404 });
  } else if (!films.some((film) => film.id === titleId)) {
    return NextResponse.json({ error: "The selected starter catalogue title does not exist." }, { status: 404 });
  }

  const { data, error } = await context.db!
    .from("media_assets")
    .insert({
      title_id: titleId,
      provider: provider.trim(),
      provider_asset_id: providerAssetId.trim(),
      status: status ?? "pending",
      created_by: context.user!.id,
    })
    .select("id, title_id, provider, provider_asset_id, status, created_at, updated_at")
    .single();

  if (error?.code === "23505") return NextResponse.json({ error: "That provider asset is already registered." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Unable to register this media asset." }, { status: 500 });
  return NextResponse.json({ asset: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const context = await adminContext();
  if (context.response) return context.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { id, status } = payload as Record<string, unknown>;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) ||
      !["pending", "processing", "ready", "failed", "disabled"].includes(String(status))) {
    return NextResponse.json({ error: "Choose a valid media asset and status." }, { status: 400 });
  }
  const { data, error } = await context.db!
    .from("media_assets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update media status." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
  return NextResponse.json({ asset: data });
}
