undefined

## Admin Studio: catalogue management

- Visit `/admin/studio` to create and edit film, series, anime and documentary catalogue records, including synopsis, slug, release year, genres, country, original language and HTTPS artwork URLs.
- The workspace includes draft, published and archived states, catalogue search, status filters and basic inventory counts. It is separate from the existing `/admin/media` workspace, which manages provider asset references and rights-window records.
- Apply `supabase/migrations/202611280002_admin_studio.sql` after the streaming foundation migration. Configure the public Supabase URL and anon key, then assign the trusted `app_metadata.role = 'admin'` to the intended administrator. Both the route/API and database RLS enforce admin writes. Public visitors can read only published metadata.
- See [Admin Studio setup](docs/ADMIN_STUDIO.md) for setup and limitations. Publishing catalogue metadata does not grant streaming rights or attach a playable video source. Episode/season management and integration of approved database records into the homepage catalogue remain subsequent work.
