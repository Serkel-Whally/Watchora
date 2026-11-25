import type { Film } from "@/lib/catalogue";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

export type CuratedCollection = {
  slug: string;
  number: string;
  title: string;
  description: string;
  editorialNote: string;
  titleIds: number[];
  tone: "warm" | "cool" | "rose" | "gold";
};

export const curatedCollections: CuratedCollection[] = [
  {
    slug: "quietly-extraordinary",
    number: "01",
    title: "Quietly extraordinary",
    description: "Small moments, lasting impressions. Stories that find the remarkable in everyday life.",
    editorialNote: "For when you want something thoughtful, intimate and beautifully observed.",
    titleIds: [4, 7, 2],
    tone: "warm",
  },
  {
    slug: "worlds-of-wonder",
    number: "02",
    title: "Worlds of wonder",
    description: "Step beyond the familiar into animation and imagination without borders.",
    editorialNote: "A little wonder goes a long way. Start here when reality can wait.",
    titleIds: [3],
    tone: "cool",
  },
  {
    slug: "edge-of-your-seat",
    number: "03",
    title: "Edge of your seat",
    description: "Tension, twists and stories that keep you leaning forward.",
    editorialNote: "For a night when you want the story to take the wheel.",
    titleIds: [6, 8],
    tone: "rose",
  },
  {
    slug: "stories-that-make-you-smile",
    number: "04",
    title: "Stories that make you smile",
    description: "Distinctive characters, unexpected detours and a lighter point of view.",
    editorialNote: "A feel-good starting point, with room for a little eccentricity.",
    titleIds: [1],
    tone: "gold",
  },
];

const provider = getCatalogueProvider();

/** Resolve editorial IDs against the active provider; stale or duplicate IDs are safely ignored. */
export function getCollectionTitles(collection: CuratedCollection): Film[] {
  const seen = new Set<number>();
  return collection.titleIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const title = provider.getById(id);
    return title ? [title] : [];
  });
}

export function getCuratedCollection(slug: string): CuratedCollection | undefined {
  return curatedCollections.find((collection) => collection.slug === slug);
}
