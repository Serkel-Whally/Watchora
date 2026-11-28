# Watchora Admin Studio

The private catalogue workspace is available at `/admin/studio`.

## Capabilities

- Create and edit film, series, anime and documentary catalogue records.
- Maintain a unique URL slug, synopsis, release year, genres, country and original language.
- Add HTTPS poster and backdrop artwork URLs.
- Keep entries in draft, publish catalogue metadata, or archive entries.
- Search and filter the first 250 recently updated titles.
- View basic catalogue totals by publication state.

## Setup

1. Apply `supabase/migrations/202611280002_admin_studio.sql` after the streaming foundation migration.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Sign in with the account intended to administer Watchora.
4. Assign the trusted `admin` role to that account in Supabase Auth app metadata. Never use user-editable `user_metadata` for authorization.
5. Open `/admin/studio`.

The route and API both check the server-verified Supabase session and `app_metadata.role === 'admin'`. Postgres row-level security independently enforces admin write access. Public clients can only read records whose status is `published`; drafts and archived records remain private.

## Current scope and important boundaries

This milestone manages catalogue metadata only. It does not upload video files, create episodes, connect a metadata provider, or grant streaming rights. The existing media studio at `/admin/media` manages provider asset references and rights-window records separately. Before a title is made playable, the server must verify that the provider asset is ready, the rights window is active for the viewer's territory and time, and the viewer is entitled to access it.

The editor accepts only HTTPS artwork URLs. Use image URLs from sources whose licensing and terms permit Watchora's intended use. Publishing metadata does not authorize distribution of the underlying film or series.

The current homepage still uses the illustrative in-repository seed catalogue. A later integration must reconcile approved database catalogue records with the public catalogue provider rather than silently replacing seed data. Season and episode management is a separate next step.
