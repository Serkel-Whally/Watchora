import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  if (!isSupabaseConfigured()) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  return { supabase };
}

async function validateSeries(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, titleId: number) {
  const { data, error } = await supabase.from("content_catalogue").select("id,kind").eq("id", titleId).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to verify the parent series." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Parent title not found." }, { status: 404 });
  if (data.kind !== "Series") return NextResponse.json({ error: "Episodes can only belong to a series." }, { status: 400 });
  return null;
}

function parseEpisode(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const item = input as Record<string, unknown>;
  const titleId = Number(item.title_id);
  const seasonNumber = Number(item.season_number);
  const episodeNumber = Number(item.episode_number);
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const runtime = item.runtime_minutes === "" || item.runtime_minutes === null || item.runtime_minutes === undefined
    ? null : Number(item.runtime_minutes);
  const status = item.status ?? "draft";
  if (!Number.isSafeInteger(titleId) || titleId <= 0 ||
      !Number.isSafeInteger(seasonNumber) || seasonNumber < 1 || seasonNumber > 100 ||
      !Number.isSafeInteger(episodeNumber) || episodeNumber < 1 || episodeNumber > 500 ||
      title.length < 1 || title.length > 180 || description.length > 3000 ||
      (runtime !== null && (!Number.isSafeInteger(runtime) || runtime < 1 || runtime > 1000)) ||
      typeof status !== "string" || !(["draft", "published", "archived"] as string[]).includes(status)) return null;
  return {
    title_id: titleId, season_number: seasonNumber, episode_number: episodeNumber,
    title, description, runtime_minutes: runtime, status,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const titleId = Number(request.nextUrl.searchParams.get("titleId"));
  if (!Number.isSafeInteger(titleId) || titleId <= 0) return NextResponse.json({ error: "A valid titleId is required." }, { status: 400 });
  const { data, error } = await auth.supabase!
    .from("content_episodes")
    .select("id,title_id,season_number,episode_number,title,description,runtime_minutes,status,created_at,updated_at")
    .eq("title_id", titleId)
    .order("season_number", { ascending: true })
    .order("episode_number", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load episodes. Apply the Admin Studio migration first." }, { status: 500 });
  return NextResponse.json({ episodes: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const episode = parseEpisode(payload);
  if (!episode) return NextResponse.json({ error: "Check the series, season, episode number, title, runtime and status." }, { status: 400 });
  const parentError = await validateSeries(auth.supabase!, episode.title_id);
  if (parentError) return parentError;
  const { data, error } = await auth.supabase!.from("content_episodes")
    .insert(episode).select("*").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That season and episode number already exists." : "Unable to create this episode." }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ episode: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid episode." }, { status: 400 });
  const item = payload as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "A valid episode ID is required." }, { status: 400 });
  const episode = parseEpisode(item);
  if (!episode) return NextResponse.json({ error: "Check the series, season, episode number, title, runtime and status." }, { status: 400 });
  const parentError = await validateSeries(auth.supabase!, episode.title_id);
  if (parentError) return parentError;
  const { data, error } = await auth.supabase!.from("content_episodes")
    .update({ ...episode, updated_at: new Date().toISOString() })
    .eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That season and episode number already exists." : "Unable to update this episode." }, { status: error.code === "23505" ? 409 : 500 });
  if (!data) return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  return NextResponse.json({ episode: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "A valid episode ID is required." }, { status: 400 });
  const { data, error } = await auth.supabase!.from("content_episodes")
    .delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to delete this episode." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
