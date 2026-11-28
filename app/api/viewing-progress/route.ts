import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function validTitleId(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Account sync is not configured." }, { status: 503 });
  }

  const titleId = Number(new URL(request.url).searchParams.get("titleId"));
  if (!validTitleId(titleId)) {
    return NextResponse.json({ error: "A valid titleId is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to sync viewing progress." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("viewing_progress")
    .select("title_id, position_seconds, duration_seconds, completed, updated_at")
    .eq("user_id", user.id)
    .eq("title_id", titleId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load viewing progress." }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Account sync is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const { titleId, position, duration, completed } = payload;
  if (
    !validTitleId(titleId) ||
    !Number.isSafeInteger(position) || Number(position) < 0 ||
    !Number.isSafeInteger(duration) || Number(duration) < 0 ||
    (typeof completed !== "boolean") ||
    (Number(duration) > 0 && Number(position) > Number(duration)) ||
    Number(position) > 60 * 60 * 24 * 7 ||
    Number(duration) > 60 * 60 * 24 * 7
  ) {
    return NextResponse.json({ error: "Progress values are outside the accepted range." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to sync viewing progress." }, { status: 401 });
  }

  const { error } = await supabase.from("viewing_progress").upsert({
    user_id: user.id,
    title_id: titleId,
    position_seconds: position,
    duration_seconds: duration,
    completed,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,title_id" });

  if (error) {
    return NextResponse.json({ error: "Could not save viewing progress." }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
