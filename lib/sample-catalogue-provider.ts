import { films } from "@/lib/catalogue";
import { getCatalogueCountries } from "@/lib/catalogue-utils";
import type { CatalogueProvider } from "@/lib/catalogue-provider";

/** Local seed provider. Replace the implementation, not the UI, when a licensed source is chosen. */
export const sampleCatalogueProvider: CatalogueProvider = {
  getAll: () => films,
  getById: (id) => films.find((title) => title.id === id),
  getCountries: () => getCatalogueCountries(films),
};

export function getCatalogueProvider(): CatalogueProvider {
  return sampleCatalogueProvider;
}
