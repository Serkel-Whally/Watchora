import type { Film } from "@/lib/catalogue";

export type CatalogueConflict = { id: number; title: string; reason: "already-exists" | "duplicate-import" };
export type CatalogueReconciliation = { accepted: Film[]; conflicts: CatalogueConflict[] };

/**
 * Reconciles reviewed imports against the authoritative catalogue snapshot.
 * Existing IDs are never silently overwritten; the first incoming occurrence wins.
 * Call this again on the server immediately before any future publish operation.
 */
export function reconcileCatalogueImport(existing: readonly Film[], incoming: readonly Film[]): CatalogueReconciliation {
  const existingIds = new Set(existing.map((title) => title.id));
  const seenIncoming = new Set<number>();
  const accepted: Film[] = [];
  const conflicts: CatalogueConflict[] = [];

  for (const title of incoming) {
    if (existingIds.has(title.id)) {
      conflicts.push({ id: title.id, title: title.title, reason: "already-exists" });
      continue;
    }
    if (seenIncoming.has(title.id)) {
      conflicts.push({ id: title.id, title: title.title, reason: "duplicate-import" });
      continue;
    }
    seenIncoming.add(title.id);
    accepted.push(title);
  }

  return { accepted, conflicts };
}
