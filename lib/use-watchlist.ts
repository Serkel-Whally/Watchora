"use client";

import { useCallback, useEffect, useState } from "react";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

const STORAGE_KEY = "watchora-watchlist";
const catalogue = getCatalogueProvider();

function validIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0 && Boolean(catalogue.getById(id))))).slice(0, 500);
}

/**
 * Guest saves stay in localStorage. When a member signs in, their local saves
 * merge with their private server watchlist; later changes sync in the background.
 */
export function useWatchlist() {
  const [saved, setSaved] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncAvailable, setSyncAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function initialise() {
      let localIds: number[] = [];
      try {
        localIds = validIds(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch {
        localIds = [];
      }
      if (!cancelled) setSaved(localIds);

      try {
        const response = await fetch("/api/watchlist", { cache: "no-store" });
        if (response.status === 503) setSyncAvailable(false);
        else if (response.status === 401) setSyncAvailable(true);
        if (response.ok) {
          setSyncAvailable(true);
          const data = await response.json();
          const merged = validIds([...validIds(data.titleIds), ...localIds]);
          const mergeResponse = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titleIds: merged }),
          });
          if (mergeResponse.ok) {
            const mergedData = await mergeResponse.json();
            const finalIds = validIds(mergedData.titleIds);
            if (!cancelled) {
              setSaved(finalIds);
              setSynced(true);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(finalIds));
            }
          }
        }
      } catch {
        // Keep the local watchlist available when offline or not signed in.
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void initialise();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: number) => {
    if (!Number.isSafeInteger(id) || id < 1) return;
    const exists = saved.includes(id);
    const next = exists ? saved.filter((value) => value !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (synced) {
      if (exists) {
        void fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: id }),
        }).catch(() => undefined);
      } else {
        void fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: id }),
        }).catch(() => undefined);
      }
    }
  }, [saved, synced]);

  const remove = useCallback((id: number) => {
    if (!saved.includes(id)) return;
    const next = saved.filter((value) => value !== id);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (synced) {
      void fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: id }),
      }).catch(() => undefined);
    }
  }, [saved, synced]);

  return { saved, ready, synced, syncAvailable, toggle, remove };
}
