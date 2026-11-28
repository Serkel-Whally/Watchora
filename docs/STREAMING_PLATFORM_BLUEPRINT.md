# Watchora streaming platform blueprint

## Product promise
Watchora is a global, licensed video-on-demand service. Members discover, stream, resume, save and discuss films and series in one product. The product must never present an unlicensed or unavailable source as playable.

## Experience architecture

### Primary navigation
- Home: continue watching, featured premieres, trending, new releases and editorial rails.
- Movies: searchable, filterable film catalogue.
- Series: searchable series catalogue with season and episode navigation.
- My List: saved titles.
- Search: global title, person, genre and collection search.
- Community: reviews, member profiles and discussions.
- Account: profile, preferences, viewing history and notifications.

### Core journeys
1. Visitor lands on Home and can resume a title, browse a rail or search.
2. Title detail presents artwork, synopsis, maturity/running-time metadata, trailer where licensed, seasons/episodes for series, and a clear Watch action only when a valid playback entitlement exists.
3. Playback creates a short-lived server-authorized session. The browser receives only a signed, expiring playback manifest URL and permitted playback configuration.
4. Player saves progress periodically and on pause/exit. Continue Watching resumes from a safe position; completed titles are removed or marked complete.
5. Members can manage My List, profiles and community participation.

## Platform architecture

### 1. Catalogue and editorial
Canonical records: titles, people, genres, countries, collections, seasons, episodes, artwork, maturity ratings, captions/subtitles and localized metadata. Vendor metadata must be normalized through provider adapters. Keep editorial curation independent of provider APIs.

### 2. Media ingestion and delivery
Recommended production path:
- Rights-cleared master upload to private object storage.
- Managed transcoding into adaptive bitrate HLS (and DASH where needed).
- Multiple renditions, thumbnails, preview sprites and audio tracks.
- Caption/subtitle ingestion and language metadata.
- CDN delivery with signed, short-lived manifests and segment access.
- DRM (Widevine/FairPlay/PlayReady) where required by rights holders.
- Automated validation for codecs, duration, audio, captions, aspect ratio and playback.

Do not store large video files in the application repository or serve them from the Next.js server. Choose a managed video vendor after comparing regional CDN coverage, DRM, encoding, storage, egress, analytics, Ghana/Africa delivery performance, and content-rights requirements.

### 3. Playback and entitlement
The browser must never receive provider API secrets, storage credentials, master-file URLs or permanent private manifests. A server endpoint authenticates the member, checks territory, title rights, subscription/rental entitlement, device/session limits and availability window, then creates a short-lived playback session. Every playback session should be auditable and revocable.

### 4. Member platform
Retain Supabase Auth and Postgres for profiles, watchlists, preferences, viewing progress, devices and entitlements. Add subscription billing only after pricing, tax, payment provider coverage and rights are confirmed. Do not treat a successful payment webhook alone as sufficient authorization; entitlement state must be checked server-side.

### 5. Community
Retain the existing moderated reviews, comments, helpful votes, reports, follows and notifications. Add clear community guidelines, rate limits, abuse controls and moderator tooling before broad public launch.

### 6. Admin studio
Role-protected workflows for title metadata, season/episode management, artwork, rights windows, territories, video assets, subtitles, publishing, takedowns and playback diagnostics. Use trusted server-side roles, audit logs and least-privilege database policies. Never rely on a hidden URL or noindex as access control.

## Suggested database domains
- catalog_titles, seasons, episodes, people, title_people, genres, title_genres, territories, collections
- media_assets, playback_renditions, subtitles, audio_tracks, rights_windows
- playback_sessions, viewing_progress, playback_events, member_devices
- plans, subscriptions, entitlements, payments (only when monetization launches)
- profiles, user_watchlist, member_preferences, title_reviews, review_comments and existing community tables

Use UUID primary keys, foreign keys, explicit status enums, UTC timestamps, indexes for member/title lookups, RLS for member-owned data, and server-only access for sensitive media/rights tables.

## Rollout plan

### Phase 0 — Product and rights readiness
Confirm content ownership/licensing, target territories, business model, age ratings, takedown process, privacy obligations and vendor costs. No production streaming without these.

### Phase 1 — Streaming-ready experience
Rework Home and navigation around viewing; build title detail, movies/series catalogues, season/episode pages, player shell, Continue Watching and viewing progress. Keep sample titles visibly non-playable until authorized assets exist.

### Phase 2 — Licensed playback
Select a managed video pipeline, implement private ingestion, transcoding, signed playback sessions, captions, adaptive playback, progress persistence, playback analytics and device/session controls.

### Phase 3 — Member access and monetization
Launch free/ad-supported, subscription or rental access only after rights and payment coverage are settled. Add entitlements, billing webhooks, cancellation, receipts and support flows.

### Phase 4 — Scale and quality
Add CDN/region analytics, playback QoE monitoring, search indexing, recommendations, localization, accessibility, content operations and security reviews.

## Non-negotiable launch gates
- Written rights for each title and each territory.
- No public or permanent origin URLs.
- Server-side entitlement and territory checks.
- Expiring signed playback sessions.
- Captions and keyboard-accessible player controls.
- Privacy policy, terms, age/maturity handling and takedown process.
- Tested mobile, low-bandwidth and TV-sized experiences.
- Playback monitoring, abuse reporting, backups and incident response.

## Current implementation status
The existing repository is a discovery/community MVP with illustrative seed metadata. It does not currently contain licensed video assets, playback sessions, adaptive streaming, DRM, subscriptions or a production content-management system. New playback UI must clearly communicate that playback is unavailable until a rights-cleared provider is configured.
