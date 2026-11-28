import "server-only";
import type { Film, TitleKind } from "@/lib/catalogue";
import { films } from "@/lib/catalogue";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const STUDIO_PUBLIC_ID_OFFSET = 1_000_000_000;

type StudioRow = {
  id: number;
  title: string;
  kind: TitleKind;
  description: string;
  release_year: number | null;
  genres: string[];
  country: string;
  original_language: string;
  poster_url: string | null;
  backdrop_url: string | null;
};

function toFilm(row: StudioRow): Film {
  return {
    id: STUDIO_PUBLIC_ID_OFFSET + row.id,
    studioId: row.id,
    title: row.title,
    year: row.release_year ?? 0,
    kind: row.kind,
    genre: row.genres?.[0] ?? "Uncategorised",
    country: row.country || "International",
    rating: "—",
    image: row.poster_url || row.backdrop_url || "/images/title-placeholder.svg",
    description: row.description,
    originalLanguage: row.original_language || undefined,
  };
}

export function getStudioDatabaseId(publicId: number): number | null {
  if (!Number.isSafeInteger(publicId) || publicId <= STUDIO_PUBLIC_ID_OFFSET) return null;
  return publicId - STUDIO_PUBLIC_ID_OFFSET;
}

export async function getPublishedStudioTitles(): Promise<Film[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("content_catalogue")
      .select("id,title,kind,description,release_year,genres,country,original_language,poster_url,backdrop_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return (data as StudioRow[]).map(toFilm);
  } catch {
    return [];
  }
}

export async function getPublicCatalogue(): Promise<Film[]> {
  const studioTitles = await getPublishedStudioTitles();
  return [...studioTitles, ...films];
}

export async function getPublicTitleById(publicId: number): Promise<Film | undefined> {
  const studioId = getStudioDatabaseId(publicId);
  if (studioId !== null) {
    const titles = await getPublishedStudioTitles();
    return titles.find((title) => title.studioId === studioId);
  }
  return films.find((title) => title.id === publicId);
}
