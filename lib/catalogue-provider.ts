import type { Film } from "@/lib/catalogue";

/**
 * Provider contract for Watchora's catalogue.
 * Future licensed metadata integrations should normalize their records to Film
 * and implement this interface; UI components should not depend on vendor APIs.
 */
export interface CatalogueProvider {
  getAll(): Film[];
  getById(id: number): Film | undefined;
  getCountries(): string[];
}

