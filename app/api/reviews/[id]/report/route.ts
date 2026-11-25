import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const reasons = ["harassment", "hate", "spam", "spoilers", "misinformation", "other"] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Reporting is not configured yet." }, { status: 503 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to report a review." }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Choose a report reason." }, { status: 400 });
  const value = payload as Record<string, unknown>;
  if (!reasons.includes(value.reason as typeof reasons[number])) return NextResponse.json({ error: "Choose a valid report reason." }, { status: 400 });
  const details = typeof value.details === "string" ? value.details.trim() : "";
  if (details.length > 500) return NextResponse.json({ error: "Additional details must be 500 characters or fewer." }, { status: 400 });
  const { error } = await supabase.from("review_reports").insert({
    review_id: id, reporter_id: user.id, reason: value.reason, details: details || null,
  });
  if (error?.code === "23505") return NextResponse.json({ error: "You have already reported this review." }, { status: 409 });
  if (error?.code === "42501" || error?.code === "23503") return NextResponse.json({ error: "This review cannot be reported." }, { status: 404 });
  if (error) return NextResponse.json({ error: "Your report could not be submitted." }, { status: 500 });
  return NextResponse.json({ submitted: true }, { status: 201 });
}
