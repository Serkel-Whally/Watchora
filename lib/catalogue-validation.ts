import type { Film } from "@/lib/catalogue";

export type CatalogueIssueCode =
  | "duplicate-id"
  | "invalid-year"
  | "invalid-rating"
  | "insecure-artwork"
  | "missing-description"
  | "missing-language";

export type CatalogueIssue = {
  code: CatalogueIssueCode;
  titleId: number;
  title: string;
  message: string;
};

/** Non-mutating quality report for editorial review and provider ingestion checks. */
export function validateCatalogue(titles: Film[]): CatalogueIssue[] {
  const issues: CatalogueIssue[] = [];
  const seenIds = new Set<number>();

  for (const title of titles) {
    const add = (code: CatalogueIssueCode, message: string) => {
      issues.push({ code, titleId: title.id, title: title.title, message });
    };

    if (seenIds.has(title.id)) add("duplicate-id", "This identifier is used by more than one title.");
    seenIds.add(title.id);

    if (!Number.isInteger(title.year) || title.year < 1888 || title.year > 2100) {
      add("invalid-year", "Release year is outside the supported range.");
    }

    const rating = Number(title.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      add("invalid-rating", "Rating must be a number from 0 to 10.");
    }

    try {
      if (new URL(title.image).protocol !== "https:") {
        add("insecure-artwork", "Artwork must use HTTPS.");
      }
    } catch {
      add("insecure-artwork", "Artwork URL is invalid.");
    }

    if (!title.description.trim()) add("missing-description", "A title description is missing.");
    if (!title.originalLanguage) add("missing-language", "Original-language metadata is not available.");
  }

  return issues;
}
