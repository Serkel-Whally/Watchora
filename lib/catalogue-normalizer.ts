import type { Film, TitleKind } from "@/lib/catalogue";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalPositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

/**
 * Converts a source-neutral metadata object into Watchora's internal title shape.
 * Vendor-specific API responses should be mapped to these canonical field names
 * in a separate adapter. Invalid records are rejected rather than partially shown.
 */
export function normalizeFilmRecord(input: unknown): Film | null {
  if (!isRecord(input)) return null;

  const { id, title, year, kind, genre, country, rating, image, description } = input;
  if (!Number.isSafeInteger(id) || (id as number) <= 0) return null;
  if (!nonEmptyString(title) || !Number.isInteger(year) || (year as number) < 1888 || (year as number) > 2100) return null;
  if (kind !== "Film" && kind !== "Series") return null;
  if (!nonEmptyString(genre) || !nonEmptyString(country) || !nonEmptyString(description)) return null;
  if (!(typeof rating === "string" || typeof rating === "number") || !Number.isFinite(Number(rating))) return null;
  if (!nonEmptyString(image)) return null;

  let imageUrl: URL;
  try {
    imageUrl = new URL(image);
  } catch {
    return null;
  }
  if (imageUrl.protocol !== "https:") return null;

  const originalLanguage = nonEmptyString(input.originalLanguage)
    ? input.originalLanguage.trim().toLowerCase()
    : undefined;
  if (originalLanguage && !/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(originalLanguage)) return null;

  const runtimeMinutes = optionalPositiveInteger(input.runtimeMinutes);
  const seasonCount = optionalPositiveInteger(input.seasonCount);

  return {
    id: id as number,
    title: title.trim(),
    year: year as number,
    kind: kind as TitleKind,
    genre: genre.trim(),
    country: country.trim(),
    rating: String(rating),
    image: imageUrl.toString(),
    description: description.trim(),
    ...(nonEmptyString(input.originalTitle) ? { originalTitle: input.originalTitle.trim() } : {}),
    ...(nonEmptyString(input.releaseDate) ? { releaseDate: input.releaseDate } : {}),
    ...(originalLanguage ? { originalLanguage } : {}),
    ...(runtimeMinutes ? { runtimeMinutes } : {}),
    ...(seasonCount ? { seasonCount } : {}),
    ...(nonEmptyString(input.ratingSource) ? { ratingSource: input.ratingSource.trim() } : {}),
  };
}
