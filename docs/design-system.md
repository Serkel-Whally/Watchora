# Watchora design principles

## Product position
Watchora is a global film, series and anime discovery guide with community features. It helps people decide what to watch, understand a title, and find a legitimate viewing destination. It is not a streaming or download host.

## Benchmark synthesis
- **Netflix, Prime Video and Disney+**: cinematic artwork, clear featured content, strong content hierarchy and browsable shelves.
- **JustWatch**: practical availability-first decision support, country/provider context and useful filters.
- **Letterboxd**: editorial typography, expressive poster presentation, lists, reviews and community identity.
- **Crunchyroll**: anime-aware content organization, clear season/episode metadata and format distinctions.
- **AniList and Anime-Planet**: structured metadata, tags, discovery paths and recommendations.

These are product-pattern references, not templates to reproduce. No single service is a complete model for Watchora.

## Experience principles
1. **Discovery before decoration** — search and the catalogue stay prominent; hero content must not bury the library.
2. **One coherent information architecture** — global primary navigation stays short; secondary destinations remain reachable through an explicit More menu and the mobile drawer.
3. **Content-led hierarchy** — artwork attracts attention, while title, year, format, origin and actions remain legible and consistent.
4. **Progressive disclosure** — expose essential controls first; group advanced filters and secondary navigation without hiding core tasks.
5. **Trust through clarity** — distinguish confirmed availability from unknown availability; show region and last-checked context when provider data exists; never imply Watchora hosts content.
6. **Inclusive interaction** — keyboard-visible focus, semantic labels, sufficient contrast, touch-friendly controls and reduced-motion support.
7. **Mobile is a first-class layout** — no desktop-only navigation, no tiny controls, horizontal shelves scroll intentionally, and dense filters collapse cleanly.
8. **Performance is part of design** — lazy-load below-the-fold artwork, avoid unnecessary animation and keep the initial discovery path lightweight.
9. **Consistent components** — shared spacing, surfaces, borders, typography, badges and action styles across catalogue, title, collection, profile and community pages.
10. **Honest personalization** — explain recommendation signals and do not label simple heuristics as AI.

## Visual system
- Background: near-black charcoal; elevated surfaces use subtle neutral contrast.
- Accent: warm muted gold, reserved for primary actions, active states and key metadata.
- Typography: Manrope for display hierarchy; DM Sans for interface and reading.
- Layout: centered content shell, consistent section rhythm, poster ratio 2:3, restrained corner radii.
- Motion: short, purposeful transitions; all motion respects reduced-motion preferences.
- Focus: high-contrast visible outline on keyboard focus.

## Quality gates
- Every route has a clear page title, useful empty/loading/error state and consistent header/footer behavior.
- Mobile menu exposes every navigation destination in a vertical list and closes on selection or Escape.
- All interactive controls are keyboard operable and have accessible names/states.
- Artwork failures do not leave misleading broken-image UI.
- Availability, ratings, metadata and catalogue completeness are never fabricated.
- Visual changes must pass TypeScript, lint and production build checks.
