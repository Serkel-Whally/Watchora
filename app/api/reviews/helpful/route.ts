import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community features are not configured yet." }, { status: 503 });
  const ids = (request.nextUrl.searchParams.get("reviewIds") || "").split(",").filter(Boolean);
  if (!ids.length || ids.length > 100 || ids.some(id => !uuidPattern.test(id))) return NextResponse.json({ error: "Provide up to 100 valid review IDs." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("get_review_helpful_counts", { p_review_ids: ids });
  if (error) return NextResponse.json({ error: "Unable to load helpful votes." }, { status: 500 });
  return NextResponse.json({ votes: data ?? [], signedIn: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
}
