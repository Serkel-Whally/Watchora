import type { Film } from "@/lib/catalogue";
import type { CuratedCollection } from "@/lib/curated-collections";

export type EditorialIssue = {
  code: "duplicate-featured-title" | "missing-featured-title" | "duplicate-homepage-collection" | "missing-homepage-collection" | "duplicate-collection-slug" | "duplicate-collection-title" | "missing-collection-title";
  reference: string;
  message: string;
};

type EditorialConfig = {
  featuredTitleIds: readonly number[];
  collectionSlugs: readonly string[];
};

type EditorialValidationInput = {
  config: EditorialConfig;
  titles: Film[];
  collections: CuratedCollection[];
};

/** Checks editorial references before they are used to render discovery surfaces. */
export function validateEditorialConfiguration({
  config,
  titles,
  collections,
}: EditorialValidationInput): EditorialIssue[] {
  const issues: EditorialIssue[] = [];
  const titleIds = new Set(titles.map((title) => title.id));
  const collectionBySlug = new Map<string, CuratedCollection>();

  for (const collection of collections) {
    if (collectionBySlug.has(collection.slug)) {
      issues.push({
        code: "duplicate-collection-slug",
        reference: collection.slug,
        message: "Collection slugs must be unique.",
      });
    }
    collectionBySlug.set(collection.slug, collection);

    const seenTitleIds = new Set<number>();
    for (const id of collection.titleIds) {
      if (seenTitleIds.has(id)) {
        issues.push({
          code: "duplicate-collection-title",
          reference: `${collection.slug}:${id}`,
          message: "A collection cannot reference the same title more than once.",
        });
      }
      seenTitleIds.add(id);
      if (!titleIds.has(id)) {
        issues.push({
          code: "missing-collection-title",
          reference: `${collection.slug}:${id}`,
          message: "The collection references a title that is not in the active catalogue.",
        });
      }
    }
  }

  const seenFeaturedIds = new Set<number>();
  for (const id of config.featuredTitleIds) {
    if (seenFeaturedIds.has(id)) {
      issues.push({
        code: "duplicate-featured-title",
        reference: String(id),
        message: "Homepage featured titles must be unique.",
      });
    }
    seenFeaturedIds.add(id);
    if (!titleIds.has(id)) {
      issues.push({
        code: "missing-featured-title",
        reference: String(id),
        message: "The homepage references a title that is not in the active catalogue.",
      });
    }
  }

  const seenHomepageSlugs = new Set<string>();
  for (const slug of config.collectionSlugs) {
    if (seenHomepageSlugs.has(slug)) {
      issues.push({
        code: "duplicate-homepage-collection",
        reference: slug,
        message: "Homepage collection selections must be unique.",
      });
    }
    seenHomepageSlugs.add(slug);
    if (!collectionBySlug.has(slug)) {
      issues.push({
        code: "missing-homepage-collection",
        reference: slug,
        message: "The homepage references a collection that does not exist.",
      });
    }
  }

  return issues;
}
