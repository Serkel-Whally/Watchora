import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { films } from "@/lib/catalogue";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024 * 1024;
const STUDIO_PUBLIC_ID_OFFSET = 1_000_000_000;

async function adminContext() {
  if (!isSupabaseConfigured()) return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.app_metadata?.role !== "admin") return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { response: NextResponse.json({ error: "Server-side admin database access is not configured." }, { status: 503 }) };
  return { db: createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }), user };
}

/**
 * TUS creation proxy. The API token remains on the server; Cloudflare returns
 * a one-time upload destination and media UID which are forwarded to tus-js-client.
 */
export async function POST(request: NextRequest) {
  const context = await adminContext();
  if (context.response) return context.response;

  const titleId = Number(request.nextUrl.searchParams.get("titleId"));
  const maxDurationSeconds = Number(request.nextUrl.searchParams.get("maxDurationSeconds"));
  const rawName = request.nextUrl.searchParams.get("fileName") ?? "watchora-video";
  const fileName = rawName.replace(/[\r\n,]/g, " ").trim().slice(0, 180) || "watchora-video";
  const uploadLengthHeader = request.headers.get("Upload-Length") ?? "";
  const uploadLength = Number(uploadLengthHeader);

  if (!Number.isSafeInteger(titleId) || titleId <= 0 ||
      !Number.isSafeInteger(maxDurationSeconds) || maxDurationSeconds < 1 || maxDurationSeconds > 36000 ||
      !/^\d+$/.test(uploadLengthHeader) || !Number.isSafeInteger(uploadLength) || uploadLength < 1 || uploadLength > MAX_UPLOAD_BYTES ||
      request.headers.get("Tus-Resumable") !== "1.0.0") {
    return NextResponse.json({ error: "Invalid title, file size, maximum duration or TUS protocol version." }, { status: 400 });
  }

  if (titleId > STUDIO_PUBLIC_ID_OFFSET) {
    const studioId = titleId - STUDIO_PUBLIC_ID_OFFSET;
    const { data: studioTitle, error } = await context.db!
      .from("content_catalogue").select("id").eq("id", studioId).maybeSingle();
    if (error) return NextResponse.json({ error: "Unable to verify the selected Studio title." }, { status: 500 });
    if (!studioTitle) return NextResponse.json({ error: "The selected Studio title does not exist." }, { status: 404 });
  } else if (!films.some((film) => film.id === titleId)) {
    return NextResponse.json({ error: "The selected starter catalogue title does not exist." }, { status: 404 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !apiToken) {
    return NextResponse.json({ error: "Cloudflare Stream upload is not configured." }, { status: 503 });
  }

  const expiry = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const appOrigin = process.env.WATCHORA_PUBLIC_ORIGIN;
  let allowedOrigins = "";
  if (appOrigin) {
    try {
      allowedOrigins = Buffer.from(new URL(appOrigin).hostname).toString("base64");
    } catch {
      return NextResponse.json({ error: "WATCHORA_PUBLIC_ORIGIN must be a valid HTTPS origin." }, { status: 503 });
    }
  }
  const metadata = [
    `name ${Buffer.from(fileName).toString("base64")}`,
    "requiresignedurls",
    `maxdurationseconds ${Buffer.from(String(maxDurationSeconds)).toString("base64")}`,
    `expiry ${Buffer.from(expiry).toString("base64")}`,
    ...(allowedOrigins ? [`allowedorigins ${allowedOrigins}`] : []),
  ].join(",");

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(uploadLength),
        "Upload-Metadata": metadata,
        "Upload-Creator": context.user!.id,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const location = response.headers.get("Location");
    const mediaId = response.headers.get("stream-media-id");
    if (!response.ok || !location || !/^https:\/\//i.test(location) || !mediaId || !/^[a-z0-9]{32}$/i.test(mediaId)) {
      return NextResponse.json({ error: "Cloudflare could not create a secure upload session." }, { status: 502 });
    }

    return new NextResponse(null, {
      status: 201,
      headers: {
        "Tus-Resumable": "1.0.0",
        Location: location,
        "stream-media-id": mediaId,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Cloudflare upload service could not be reached." }, { status: 502 });
  }
}
