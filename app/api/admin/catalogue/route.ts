import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TitleKind = "Film" | "Series" | "Anime" | "Documentary";
type TitleStatus = "draft" | "published" | "archived";

async function requireAdmin() {
  if (!isSupabaseConfigured()) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  return { supabase, user };
}

const fields = "id,title,slug,kind,description,release_year,genres,country,original_language,poster_url,backdrop_url,status,created_at,updated_at";

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length <= max ? result : null;
}

function validImage(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

function parseRecord(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const item = input as Record<string, unknown>;
  const title = cleanText(item.title, 180);
  const slug = cleanText(item.slug, 180);
  const description = cleanText(item.description ?? "", 5000);
  const country = cleanText(item.country ?? "", 100);
  const originalLanguage = cleanText(item.original_language ?? "", 20);
  const kind = item.kind;
  const status = item.status ?? "draft";
  const rawYear = item.release_year;
  const year = rawYear === undefined || rawYear === "" || rawYear === null ? null : Number(rawYear);
  const genres = Array.isArray(item.genres) && item.genres.length <= 12 && item.genres.every((g) => typeof g === "string" && g.trim().length > 0 && g.length <= 40)
    ? [...new Set(item.genres.map((g) => (g as string).trim()))] : null;
  const poster = item.poster_url ? validImage(item.poster_url) : null;
  const backdrop = item.backdrop_url ? validImage(item.backdrop_url) : null;
  if (!title || !slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || description === null || country === null || originalLanguage === null ||
      typeof kind !== "string" || !["Film", "Series", "Anime", "Documentary"].includes(kind) ||
      typeof status !== "string" || !["draft", "published", "archived"].includes(status) ||
      (year !== null && (!Number.isInteger(year) || year < 1888 || year > 2200)) ||
      genres === null || (item.poster_url && !poster) || (item.backdrop_url && !backdrop)) return null;
  return {
    title, slug, kind: kind as TitleKind, description, release_year: year, genres, country,
    original_language: originalLanguage, poster_url: poster, backdrop_url: backdrop, status: status as TitleStatus,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase!
    .from("content_catalogue").select(fields).order("updated_at", { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: "Unable to load the catalogue. Apply the Admin Studio migration first." }, { status: 500 });
  return NextResponse.json({ titles: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const record = parseRecord(payload);
  if (!record) return NextResponse.json({ error: "Check the required fields, slug, year, genres and HTTPS artwork URLs." }, { status: 400 });
  const { data, error } = await auth.supabase!.from("content_catalogue")
    .insert({ ...record, created_by: auth.user!.id, updated_by: auth.user!.id })
    .select(fields).single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That slug is already in use." : "Unable to create this title." }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ title: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Invalid title." }, { status: 400 });
  const item = payload as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "A valid title ID is required." }, { status: 400 });
  const record = parseRecord(item);
  if (!record) return NextResponse.json({ error: "Check the required fields, slug, year, genres and HTTPS artwork URLs." }, { status: 400 });
  const { data, error } = await auth.supabase!.from("content_catalogue")
    .update({ ...record, updated_by: auth.user!.id, updated_at: new Date().toISOString() })
    .eq("id", id).select(fields).maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That slug is already in use." : "Unable to update this title." }, { status: error.code === "23505" ? 409 : 500 });
  if (!data) return NextResponse.json({ error: "Title not found." }, { status: 404 });
  return NextResponse.json({ title: data });
}
