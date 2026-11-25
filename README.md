# Watchora

A premium, worldwide movie and TV discovery experience. Watchora helps people decide what to watch and find legitimate places to watch it. It does not host or stream video.

## Product principles
- Global catalogue and country-aware discovery
- Premium, responsive, dark-first interface
- Discovery first; no streaming or availability claims without licensed data
- Keep the MVP cost-conscious: sample catalogue first, external services only when justified
- Treat provider metadata as untrusted input and normalize it before it reaches the UI

## Current catalogue architecture
- `lib/catalogue.ts` defines Watchora's internal `Film` shape and illustrative seed records.
- `lib/catalogue-provider.ts` defines the provider contract consumed by the app.
- `lib/sample-catalogue-provider.ts` supplies local sample data without network calls.
- `lib/catalogue-normalizer.ts` validates and converts source-neutral records into the internal title shape, including HTTPS artwork and 0–10 rating bounds.
- `lib/catalogue-validation.ts` reports editorial/data-quality issues without mutating catalogue records.
- `lib/catalogue-import.ts` safely parses canonical JSON imports, rejects invalid records and duplicate IDs, and returns quality warnings. It is a pure validation/import utility; it does not write to the live catalogue or database.
- `lib/catalogue-reconciliation.ts` compares reviewed imports against an existing catalogue snapshot and rejects ID collisions rather than silently overwriting existing titles. A future publisher must run this check server-side against the authoritative data immediately before publishing.
- `data/catalogue-import.example.json` documents the version 1 import format.

### Import format
The importer accepts either a JSON array of title records or a versioned envelope:

```json
{
  "version": 1,
  "titles": []
}
```

Each title must use Watchora's canonical fields: `id`, `title`, `year`, `kind` (`Film` or `Series`), `genre`, `country`, `rating` (0–10), `image` (HTTPS URL), and `description`. Optional fields include `originalTitle`, `releaseDate`, `originalLanguage`, `runtimeMinutes`, `seasonCount` and `ratingSource`.

The importer keeps the first valid occurrence of an ID and rejects later duplicates. It returns rejected-record reasons separately from quality warnings, so an editorial review step can distinguish invalid data from incomplete optional metadata. It deliberately performs no network requests, file writes or live catalogue replacement.


### Local import review
- Visit `/catalogue-review` to validate a JSON file in the browser, inspect accepted/rejected records and quality warnings, select records, and export a reviewed version 1 JSON file.
- The review page does not upload files, persist data, or publish changes. It is unlisted, not indexed, and is **not** an authenticated admin console.
- Imported IDs that already exist in the current seed catalogue are flagged and excluded from the approved export. This check is only against the in-repository seed data; a future database-backed publishing workflow must repeat conflict checks against the authoritative catalogue at commit time.
- Publishing remains a separate reviewed Git operation. Never treat a browser export as authorization to replace production data.

## Editorial workflow and safety
- `lib/editorial.ts` is the single source of truth for homepage featured titles, selected collections and section copy.
- `lib/curated-collections.ts` contains the editorial collection registry and each collection's title references.
- `lib/editorial-validation.ts` checks duplicate and unresolved title/collection references.
- Invalid editorial references fail the Next.js build, so broken homepage slots and collection links are caught before deployment.
- Editorial configuration is currently changed through reviewed Git commits. There is deliberately no public write interface or unauthenticated admin route. A role-protected editor should only be added alongside a real authentication and authorization layer.

Vendor-specific credentials, API calls, caching and licensing checks belong in a server-side adapter, not in client components. Do not expose provider secrets in `NEXT_PUBLIC_*` variables.

## Discovery interface notes
- Collection cards link to dedicated `/collections/[slug]` editorial pages, with title cards presented as a horizontal, snap-scrolling shelf on smaller screens and a grid on wide screens.
- Homepage featured titles and the homepage sample catalogue use horizontal shelves; the full Explore page remains a filterable grid for scanning results.
- Mobile navigation is a right-edge drawer that slides left into view, locks background scrolling while open, closes with Escape or backdrop tap, and stacks navigation links vertically.

## Current limitations
The included catalogue is a small illustrative preview, not a licensed or comprehensive worldwide database. Ratings and artwork are not presented as verified live metadata. Streaming availability is not connected. Before launch with real catalogue data, secure appropriate metadata and artwork rights, document attribution requirements, and select a provider whose terms permit the intended commercial use.

## Development

Built with Next.js, TypeScript and Tailwind CSS.

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

No paid metadata API, database, authentication service or AI service is required to run the current preview.
