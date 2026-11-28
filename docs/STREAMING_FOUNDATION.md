# Streaming foundation implementation

This milestone adds the first production-oriented persistence layer for Watchora's future licensed playback pipeline.

## Added in this milestone

- `supabase/migrations/202611280001_streaming_foundation.sql`
  - `media_assets`: private references to assets held by a video provider.
  - `rights_windows`: territory-specific distribution windows with start/end times and editorial status.
  - `playback_sessions`: server-managed playback audit records with expiry and revocation fields.
  - `viewing_progress`: per-member resume positions, completion state and timestamps.
  - Row-level security and grants that keep provider inventory, rights and session records inaccessible to browser clients.
  - Member-owned RLS policies for viewing progress.
- `app/api/viewing-progress/route.ts`
  - Authenticated GET for one title's progress.
  - Authenticated PUT with strict payload bounds and ownership derived from the verified Supabase session.
  - No user ID is accepted from the browser.
- `components/playback-player.tsx`
  - Keeps guest progress in local storage.
  - Loads signed-in progress from the server and syncs playback checkpoints, pause, end and page-exit events.
  - Falls back to local progress when offline, signed out or when account sync is unavailable.

## Apply the migration

Run the SQL migration in the Supabase SQL editor or through the project's normal migration workflow:

`supabase/migrations/202611280001_streaming_foundation.sql`

The application must have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for authenticated account sync. The migration must be applied before the new progress endpoint can persist data.

## Important security boundary

The migration deliberately gives browser roles no direct access to `media_assets`, `rights_windows` or `playback_sessions`. A future server-side video adapter must validate the signed-in user, title rights, territory, entitlement and session limits before creating a short-lived provider playback session. Provider credentials, source files and permanent manifest URLs must never be sent to the browser or committed to Git.

## Not yet enabled

This milestone does not connect a video vendor, create signed manifests, implement DRM, or grant streaming rights to any sample catalogue title. The player therefore remains unavailable until a licensed provider and its server-side adapter are configured. The sample catalogue remains illustrative.
