import type { Film } from "@/lib/catalogue";
import { normalizeFilmRecord } from "@/lib/catalogue-normalizer";
import { validateCatalogue, type CatalogueIssue } from "@/lib/catalogue-validation";

export type CatalogueImportRejection = {
  index: number;
  reason: string;
};

export type CatalogueImportResult = {
  titles: Film[];
  rejected: CatalogueImportRejection[];
  issues: CatalogueIssue[];
};

/**
 * Accepts either a JSON array of canonical title records or a versioned
 * { version: 1, titles: [...] } envelope. It does not write to storage.
 */
export function importCatalogueJson(input: string | unknown): CatalogueImportResult {
  let payload: unknown = input;

  if (typeof input === "string") {
    try {
      payload = JSON.parse(input) as unknown;
    } catch {
      return {
        titles: [],
        rejected: [{ index: -1, reason: "The import file is not valid JSON." }],
        issues: [],
      };
    }
  }

  let records: unknown[];
  if (Array.isArray(payload)) {
    records = payload;
  } else if (
    typeof payload === "object" &&
    payload !== null &&
    !Array.isArray(payload) &&
    "version" in payload &&
    "titles" in payload
  ) {
    const envelope = payload as { version: unknown; titles: unknown };
    if (envelope.version !== 1) {
      return {
        titles: [],
        rejected: [{ index: -1, reason: "Unsupported catalogue import version. Expected version 1." }],
        issues: [],
      };
    }
    if (!Array.isArray(envelope.titles)) {
      return {
        titles: [],
        rejected: [{ index: -1, reason: "The version 1 import must contain a titles array." }],
        issues: [],
      };
    }
    records = envelope.titles;
  } else {
    return {
      titles: [],
      rejected: [{ index: -1, reason: "Expected a JSON array or a version 1 catalogue envelope." }],
      issues: [],
    };
  }

  const titles: Film[] = [];
  const rejected: CatalogueImportRejection[] = [];
  const seenIds = new Set<number>();

  records.forEach((record, index) => {
    const title = normalizeFilmRecord(record);
    if (!title) {
      rejected.push({
        index,
        reason: "Record failed canonical title validation. Check required fields, rating, year and HTTPS artwork.",
      });
      return;
    }

    if (seenIds.has(title.id)) {
      rejected.push({
        index,
        reason: `Duplicate title ID ${title.id}; the first valid occurrence is retained.`,
      });
      return;
    }

    seenIds.add(title.id);
    titles.push(title);
  });

  return {
    titles,
    rejected,
    issues: validateCatalogue(titles),
  };
}
