import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Source-neutral playback contract.
 *
 * Provider credentials and permanent source identifiers stay server-side.
 * Only short-lived signed manifests are returned to an authenticated viewer.
 */
export type PlaybackProtocol = "hls" | "dash" | "mp4";

export type PlaybackSession = {
  titleId: number;
  protocol: PlaybackProtocol;
  manifestUrl: string;
  expiresAt: string;
  subtitles: Array<{
    language: string;
    label: string;
    url: string;
    isDefault?: boolean;
  }>;
  drm?: {
    scheme: "widevine" | "fairplay" | "playready";
    licenseUrl: string;
  };
};

export type PlaybackAvailability =
  | { status: "available"; session: PlaybackSession }
  | { status: "unavailable"; reason: "not_configured" | "not_licensed" | "not_in_territory" | "not_entitled" };

type CloudflareVideoDetails = {
  uid?: string;
  readyToStream?: boolean;
  requireSignedURLs?: boolean;
  status?: { state?: string };
};

function unavailable(reason: Extract<PlaybackAvailability, { status: "unavailable" }>["reason"]): PlaybackAvailability {
  return { status: "unavailable", reason };
}

function getViewerTerritory(value: string | null): string {
  const code = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(code) ? code : "WORLD";
}

/**
 * Cloudflare Stream adapter.
 *
 * Requires an authenticated member, a ready Cloudflare asset marked
 * requireSignedURLs=true, and a currently active rights window for the
 * viewer's country or WORLD. No browser-supplied title/user/territory is trusted.
 */
export async function createPlaybackSession(titleId: number): Promise<PlaybackAvailability> {
  if (!Number.isSafeInteger(titleId) || titleId <= 0 || !isSupabaseConfigured()) {
    return unavailable("not_configured");
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !apiToken || !customerCode || !/^[a-z0-9-]{4,64}$/i.test(customerCode) || !supabaseUrl || !serviceKey) {
    return unavailable("not_configured");
  }

  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) return unavailable("not_entitled");

    const requestHeaders = await headers();
    const territory = getViewerTerritory(
      requestHeaders.get("cf-ipcountry") ?? requestHeaders.get("x-vercel-ip-country"),
    );
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: asset, error: assetError } = await db
      .from("media_assets")
      .select("id,provider,provider_asset_id,status")
      .eq("title_id", titleId)
      .eq("status", "ready")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assetError) return unavailable("not_configured");
    if (!asset || asset.provider.toLowerCase() !== "cloudflare-stream" ||
        !/^[a-z0-9]{32}$/i.test(asset.provider_asset_id)) {
      return unavailable("not_licensed");
    }

    const now = new Date();
    const { data: rights, error: rightsError } = await db
      .from("rights_windows")
      .select("id,territory_code,starts_at,ends_at")
      .eq("media_asset_id", asset.id)
      .eq("status", "active")
      .lte("starts_at", now.toISOString())
      .or(`ends_at.is.null,ends_at.gt.${now.toISOString()}`);

    if (rightsError) return unavailable("not_configured");
    const permitted = (rights ?? []).some((window) =>
      window.territory_code === "WORLD" || window.territory_code === territory,
    );
    if (!permitted) return unavailable((rights ?? []).length ? "not_in_territory" : "not_licensed");

    const apiBase = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/stream/${encodeURIComponent(asset.provider_asset_id)}`;
    const authorization = { Authorization: `Bearer ${apiToken}` };

    const detailsResponse = await fetch(apiBase, {
      headers: authorization,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!detailsResponse.ok) return unavailable("not_configured");
    const detailsPayload = await detailsResponse.json() as { success?: boolean; result?: CloudflareVideoDetails };
    const details = detailsPayload.result;
    if (!detailsPayload.success || !details ||
        details.uid !== asset.provider_asset_id ||
        details.readyToStream !== true ||
        details.requireSignedURLs !== true) {
      return unavailable("not_licensed");
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const tokenResponse = await fetch(`${apiBase}/token`, {
      method: "POST",
      headers: { ...authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ exp: Math.floor(expiresAt.getTime() / 1000) }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!tokenResponse.ok) return unavailable("not_configured");
    const tokenPayload = await tokenResponse.json() as { success?: boolean; result?: { token?: string } };
    const token = tokenPayload.result?.token;
    if (!tokenPayload.success || typeof token !== "string" || token.length < 20) {
      return unavailable("not_configured");
    }

    const { error: auditError } = await db.from("playback_sessions").insert({
      user_id: user.id,
      title_id: titleId,
      media_asset_id: asset.id,
      territory_code: territory,
      expires_at: expiresAt.toISOString(),
    });
    if (auditError) return unavailable("not_configured");

    return {
      status: "available",
      session: {
        titleId,
        protocol: "hls",
        manifestUrl: `https://customer-${customerCode}.cloudflarestream.com/${token}/manifest/video.m3u8`,
        expiresAt: expiresAt.toISOString(),
        subtitles: [],
      },
    };
  } catch {
    return unavailable("not_configured");
  }
}
