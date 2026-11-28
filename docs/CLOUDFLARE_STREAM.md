# Cloudflare Stream playback setup

Watchora now has a server-side Cloudflare Stream playback adapter. It issues short-lived HLS tokens only after checking the signed-in viewer, the media inventory, the asset's privacy/readiness state and the applicable distribution-rights window.

## Required server environment variables

Set these in the deployment environment (never in a NEXT_PUBLIC_ variable):

- CLOUDFLARE_ACCOUNT_ID: Cloudflare account identifier.
- CLOUDFLARE_STREAM_API_TOKEN: API token with Stream permissions to read video details and create signed tokens.
- CLOUDFLARE_STREAM_CUSTOMER_CODE: customer code used in customer-<code>.cloudflarestream.com.
- SUPABASE_SERVICE_ROLE_KEY: server-only Supabase service-role key. Do not expose it to the browser.
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY: existing Supabase application settings.

Restart/redeploy the application after setting environment variables.

## Prepare a video

1. Upload only content Watchora is legally authorized to distribute to your Cloudflare Stream account. This milestone does not yet provide a direct upload interface; use the Cloudflare dashboard or a trusted ingest workflow.
2. In Cloudflare Stream, make the video private by enabling Require Signed URLs. Public UID playback must be disabled.
3. Wait until Cloudflare reports the asset is ready to stream.
4. Open Watchora's private /admin/media workspace.
5. Register the asset against its Watchora catalogue title. Use the exact provider name cloudflare-stream, paste the Cloudflare Stream video UID, and set its inventory status to ready.
6. Create a distribution-rights window for the asset. Keep it in draft until the agreement has been reviewed. Only activate it once the written licence permits Watchora to distribute that title in the selected territory and date range.

The playback adapter independently checks Cloudflare's video details. It refuses assets that are not ready or do not require signed URLs, even if an administrator marked the local inventory row as ready.

## How playback authorization works

- A viewer must be signed in.
- The server determines territory from the edge-provided CF-IPCountry or x-vercel-ip-country header. The browser cannot submit a country code to bypass this check.
- An active rights window must cover the current time and either the viewer's ISO country code or WORLD.
- The server checks the private asset record, verifies Cloudflare reports readyToStream=true and requireSignedURLs=true, and requests a signed token.
- The token expires after 15 minutes. Only the signed HLS manifest URL is sent to the player.
- A playback audit row is recorded in playback_sessions. Provider API tokens, permanent video UIDs and service-role credentials are not returned to the browser.

When no trusted country header is available (for example, some local development setups), Watchora falls back to WORLD. This means only a WORLD rights window will authorize playback in that environment.

## Current limitations

- This milestone uses Cloudflare Stream for VOD HLS playback; the adapter does not yet implement DRM, downloads, live streaming or subtitles.
- Watchora does not yet have subscription/payment entitlement checks. For now, a signed-in member may play a title only when its media asset and active territory rights pass validation.
- Direct browser-to-Cloudflare uploads and upload webhooks are not yet implemented. Asset ingest is an administrator-managed step.
- Cloudflare Stream usage is billed by the provider. Review current pricing and expected storage/delivery usage before enabling a large catalogue.
- A working provider account, API token, customer code, Supabase migration and rights-cleared media are required. Without them, the player intentionally remains unavailable.

Never use public sample streams, random video URLs or embeds as substitutes for licensed content.
