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
- `lib/catalogue-normalizer.ts` validates and converts source-neutral records into the internal title shape. A future vendor adapter should map its response to canonical fields before calling this function.
- `lib/catalogue-validation.ts` reports editorial/data-quality issues without mutating catalogue records.

The normalizer deliberately rejects incomplete records and non-HTTPS artwork. Vendor-specific credentials, API calls, caching and licensing checks belong in a server-side adapter, not in client components. Do not expose provider secrets in `NEXT_PUBLIC_*` variables.

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
