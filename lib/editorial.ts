import type { Film } from "@/lib/catalogue";
import { curatedCollections, type CuratedCollection } from "@/lib/curated-collections";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

/**
 * Homepage merchandising is configured here instead of being hard-coded into
 * the page component. Keep IDs aligned with the active catalogue provider.
 */
export const homepageEditorial = {
  featuredTitleIds: [4,  6, 3, 1],
  collectionSlugs: [
    "quietly-extraordinary",
    "worlds-of-wonder",
    "edge-of-your-seat",
  ],
  featuredEyebrow: "Selected for discovery",
  featuredHeading: "A few stories worth your time",
  featuredDescription: "A considered starting point from the Watchora sample catalogue.",
} as const;

const catalogue = getCatalogueProvider();

function unique<T>(items: T[], key: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/** Resolve featured IDs against the provider; missing IDs never break the page. */
export function getHomepageFeaturedTitles(): Film[] {
  return unique(
    homepageEditorial.featuredTitleIds.flatMap((id) => {
      const title = catalogue.getById(id);
      return title ? [title] : [];
    }),
    (title) => title.id,
  );
}

/** Resolve collection slugs against the editorial collection registry. */
export function getHomepageCollections(): CuratedCollection[] {
  return unique(
    homepageEditorial.collectionSlugs.flatMap((slug) => {
      const collection = curatedCollections.find((item) => item.slug === slug);
      return collection ? [collection] : [];
    }),
    (collection) => collection.slug,
  );
}
