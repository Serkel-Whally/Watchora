# Watchora

A premium, global streaming-platform foundation for discovering, watching and discussing films and series. The repository is currently a discovery/community MVP with a playback-ready UI shell; no licensed video provider or production streaming assets are connected yet. Watchora must only stream content it owns or is authorised to distribute.

See [the streaming platform blueprint](docs/STREAMING_PLATFORM_BLUEPRINT.md) for the product structure, media architecture, rollout and launch gates.

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
- The homepage unifies the cinematic landing experience and full catalogue discovery into one continuous journey: cinematic hero with immediate catalogue search and mood finder; locally personalized/recently viewed picks; an editorial featured-title shelf; horizontal curated-collection cards; and the complete searchable, filterable catalogue with format, genre, country, language, decade and sort controls. This ordering gives visitors inspiration and quick routes into discovery before presenting the full catalogue, without creating a second browse destination. `/explore` redirects to `/#discover` so there is one primary browse experience. Personalization is explainable and browser-derived; it is not presented as AI.
- Mobile navigation is a right-edge drawer that slides left into view, locks background scrolling while open, closes with Escape or backdrop tap, and stacks navigation links vertically.

## Community reviews and authentication

- Title pages use Supabase Auth passwordless email sign-in and a Supabase Postgres review store.
- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project.
- Apply the SQL migrations in `supabase/migrations/` in numerical order before enabling the feature. Migration 003 adds spoiler labels, 004 adds member review reports, 005 adds atomic moderation and its audit trail, 006 adds public member profile bios, 007 adds helpful votes and member reputation, and 008 adds the privacy-conscious community activity feed, 009 adds private member watchlists, 010 adds private notifications for review decisions and helpful votes, 011 adds member follows and a personalised following activity feed, and 012 adds moderated, spoiler-aware threaded review comments, and 013 adds notifications for approved comments and replies.
- In Supabase Authentication, configure the site URL and add the deployed Watchora domain plus local development callback URLs to the allowed redirect URLs. Configure SMTP/custom email delivery before inviting real users.
- Users may submit one review per title. Reviews are created with `pending` status; only approved reviews are returned to public visitors. Users can label a review as containing spoilers; the public interface hides its text behind a reveal action, and the moderation queue highlights the label. Users can remove their own review, but cannot change its rating, text or moderation status after submission. Signed-in members can report another member’s approved review for spam, harassment, hate, unmarked spoilers, misleading information or another concern. Duplicate reports by the same member are blocked. Reports are private to admins and can be marked resolved or dismissed in the moderation workspace.
- Moderation is handled at `/admin/reviews`, a private, noindex workspace. Apply all SQL migrations. To authorize a moderator, set the user's trusted `auth.users.raw_app_meta_data.role` to `admin` in the Supabase SQL editor (never use user-editable `user_metadata`). The API checks the signed-in user's server-verified app metadata, and Postgres RLS independently enforces the same admin role for reading pending submissions and updating status. Review each submission and approve or reject it. The same workspace includes a private report queue for investigating member flags and recording a resolution or dismissal; resolving a report does not automatically remove or reject the underlying review. Never grant public clients permission to approve reviews.
- The API validates title IDs against the current catalogue, validates rating and text length, requires an authenticated user to submit, and relies on Postgres row-level security for ownership and public visibility.
- Do not expose a Supabase service-role key in browser variables. The public anon/publishable key is intended for the browser with RLS enabled.
- Members can save titles to a private watchlist. Guest saves stay in browser storage; when a member signs in, local saves merge into their account watchlist and future changes sync across devices. Apply migration 009 to enable this; row-level security restricts each member to their own saved titles. The `/watchlist` page indicates whether the list is account-synced or device-only. Members can edit a public display name and short bio at `/profile`, and review their own pending, approved and rejected submissions there. Public member pages at `/members/[id]` show only approved reviews; spoiler-marked review text stays concealed. Profile records contain no email field, and account review history is available only to the signed-in owner. Members can mark other members’ approved reviews as helpful; each account gets one toggleable vote per review and cannot vote for its own review. Voter identities remain private. Public reputation and `/community` rankings are based on approved reviews and helpful votes, not purchased boosts. `/activity` shows recent approved reviews; spoiler-marked review text is never returned to the public activity feed. `/notifications` shows private review approval/rejection, helpful-vote, approved-comment and reply updates, with per-item and mark-all-as-read controls. Comment notifications are created only after moderator approval; they notify the review owner and, for replies, the parent comment author. Notifications are private to their recipient. Members can follow other public profiles; `/following` shows approved reviews from followed members only, and spoiler-marked text is never returned by its feed RPC. Follow relationships are private to the involved members, and members cannot follow themselves. Approved title reviews support one-level comments and replies. New comments remain pending until an admin approves them at `/admin/reviews`; spoiler-marked comment text is hidden behind a reveal action. Members can read public approved discussions and see their own pending submissions.
- The app displays public community averages from approved reviews only. Sample catalogue ratings remain separately labelled as illustrative.

Before opening reviews widely, configure Supabase email delivery, add rate limiting/abuse monitoring, publish community guidelines and a privacy notice, and test account deletion and moderation procedures. Keep admin assignment restricted to trusted project owners.

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


## Playback experience foundation

The streaming UI now includes a dedicated `/watch/[id]` route and reusable playback component. The player accepts only a server-created `PlaybackAvailability` session, supports provider-supplied subtitle tracks, and saves resume position locally in the browser. The homepage's Continue Watching shelf reads this device-local progress.

Playback is intentionally unavailable until a licensed media provider and server-side entitlement checks are configured. Viewing progress is currently device-local and is not synced between signed-in devices. The current sample catalogue does not include episode-level data, so series episode navigation must be populated from verified/licensed metadata before it is exposed.


## Admin media studio

- Visit `/admin/media` to register video-provider asset references, track ingest status and draft territory-specific distribution-rights windows.
- The media studio API verifies the signed-in user's trusted `auth.users.raw_app_meta_data.role = 'admin'` before every operation. The service-role key is used only inside server route handlers after that role check; it must never use a `NEXT_PUBLIC_*` variable or be exposed to the browser.
- Configure `SUPABASE_SERVICE_ROLE_KEY` as a server-only deployment environment variable, alongside `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Apply `supabase/migrations/202611280001_streaming_foundation.sql` before using the studio. The media asset, rights-window and playback-session tables intentionally deny direct browser access.
- The current media studio registers provider asset identifiers; it does not upload files to a vendor or issue playback manifests. A provider-specific adapter, webhook verification, entitlement checks, signed playback sessions and DRM integration remain required.
- Rights windows start in draft. Mark a window active only after verifying the executed distribution agreement, permitted territory, platform/format rights and exact dates. An active record in this editorial tool is not a substitute for legal review or a provider playback entitlement.
- The studio's title selector currently references the small in-repository sample catalogue. A database-backed global catalogue and season/episode editor are a later milestone.


## Admin Studio: catalogue management

- Visit `/admin/studio` to create and edit film, series, anime and documentary catalogue records, including synopsis, slug, release year, genres, country, original language and HTTPS artwork URLs.
- The workspace includes draft, published and archived states, catalogue search, status filters and basic inventory counts. It is separate from the existing `/admin/media` workspace, which manages provider asset references and rights-window records.
- Apply `supabase/migrations/202611280002_admin_studio.sql` after the streaming foundation migration. Configure the public Supabase URL and anon key, then assign the trusted `app_metadata.role = 'admin'` to the intended administrator. Both the route/API and database RLS enforce admin writes. Public visitors can read only published metadata.
- See [Admin Studio setup](docs/ADMIN_STUDIO.md) for setup and limitations. Publishing catalogue metadata does not grant streaming rights or attach a playable video source. Episode/season management and integration of approved database records into the homepage catalogue remain subsequent work.

- Series entries now link to `/admin/studio/[id]/episodes`, where admins can group, create, edit and delete season/episode metadata. Episode endpoints verify the parent title is a Series; public RLS requires both the episode and parent series to be published. See [Admin Studio setup](docs/ADMIN_STUDIO.md). The current public catalogue/player still needs a follow-on integration to consume these records and connect licensed episode assets.


## Public catalogue integration

- The homepage now requests published Admin Studio entries from `/api/catalogue` and adds them to discovery filters and search while preserving the existing illustrative starter catalogue.
- Published Studio entries use a separate public numeric ID namespace so they cannot collide with the starter catalogue IDs. Their detail pages resolve through the server-side catalogue adapter; the watch route uses the underlying Studio database ID when requesting a playback session.
- Series detail pages display published season/episode metadata from the Studio database. Public reads remain subject to the database's published-only row-level security policies.
- This is a metadata integration, not a video integration. The player continues to report playback unavailable until a licensed provider, active territory rights and entitlement checks are connected. The public homepage currently hydrates Studio titles after initial render; curated editorial shelves still use the configured editorial seed data.


## Secure Cloudflare Stream playback

- Watchora now supports VOD HLS sessions through a server-side Cloudflare Stream adapter. The player uses native HLS where available and hls.js elsewhere.
- Media Studio can register assets against both starter titles and Admin Studio titles. Studio titles use the same separate public ID namespace as the homepage and playback routes.
- The playback adapter requires an authenticated member, a ready asset registered as cloudflare-stream, Cloudflare's requireSignedURLs=true and readyToStream=true checks, and an active rights window covering the viewer's territory or WORLD.
- Signed manifest tokens are requested server-side with a 15-minute expiry. Playback audit rows are stored in playback_sessions. No permanent video URL or provider API credential is sent to the browser.
- Configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN, CLOUDFLARE_STREAM_CUSTOMER_CODE and SUPABASE_SERVICE_ROLE_KEY as server-only deployment secrets. See [Cloudflare Stream setup](docs/CLOUDFLARE_STREAM.md).
- This does not yet implement direct uploads, webhook-based ingest, DRM, downloads, live video, subtitle ingestion or subscription entitlements. Only upload media Watchora has distribution rights to stream, and activate rights windows only after legal approval.

- Media Studio now provisions resumable Cloudflare TUS uploads for videos under 30 GB. The browser sends video bytes directly to Cloudflare; the application server only provisions a one-time upload destination and then registers the returned asset UID as processing. Assets must finish encoding before an administrator marks them ready. See [Cloudflare Stream setup](docs/CLOUDFLARE_STREAM.md).
