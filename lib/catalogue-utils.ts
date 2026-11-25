import type { Film, TitleKind } from "@/lib/catalogue";

export type CatalogueFilters = {
  query?: string;
  genre?: string;
  kind?: TitleKind | "All";
  country?: string;
};

export type CatalogueSort = "featured" | "newest" | "oldest" | "rating";

export function filterCatalogue(titles: Film[], filters: CatalogueFilters): Film[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  return titles.filter((title) => {
    const matchesQuery = !query || [
      title.title,
      title.originalTitle ?? "",
      title.country,
      title.genre,
      title.description,
      title.originalLanguage ?? "",
    ].some((field) => field.toLocaleLowerCase().includes(query));

    return matchesQuery
      && (!filters.genre || filters.genre === "All" || title.genre === filters.genre)
      && (!filters.kind || filters.kind === "All" || title.kind === filters.kind)
      && (!filters.country || filters.country === "All" || title.country === filters.country);
  });
}

export function sortCatalogue(titles: Film[], sort: CatalogueSort): Film[] {
  const copy = [...titles];
  switch (sort) {
    case "newest": return copy.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    case "oldest": return copy.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    case "rating": return copy.sort((a, b) => Number(b.rating) - Number(a.rating) || a.title.localeCompare(b.title));
    default: return copy;
  }
}

export function paginateCatalogue<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: currentPage,
    pageCount,
    totalItems: items.length,
    startIndex: items.length ? start + 1 : 0,
    endIndex: Math.min(start + safePageSize, items.length),
  };
}

export function getCatalogueCountries(titles: Film[]): string[] {
  return [...new Set(titles.map((title) => title.country))].sort((a, b) => a.localeCompare(b));
}
