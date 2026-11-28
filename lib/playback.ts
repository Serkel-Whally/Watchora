/**
 * Source-neutral playback contract.
 *
 * Only a trusted server-side video adapter may create PlaybackSession values.
 * Never put provider credentials, origin storage URLs or permanent manifests
 * in the catalogue or client bundle.
 */
export type PlaybackProtocol = "hls" | "dash" | "mp4";

export type PlaybackSession = {
  titleId: number;
  protocol: PlaybackProtocol;
  /** Short-lived, signed URL returned by a trusted server-side provider. */
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

/**
 * Placeholder until a licensed media provider and server-side entitlement
 * service are configured. This intentionally returns unavailable; never
 * substitute a random public video URL or a third-party embed.
 */
export async function createPlaybackSession(_titleId: number): Promise<PlaybackAvailability> {
  return { status: "unavailable", reason: "not_configured" };
}
