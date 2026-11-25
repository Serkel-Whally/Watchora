import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Community reviews are not configured yet." }, { status: 503 });
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to remove a review." }, { status: 401 });
  const { error, count } = await supabase.from("title_reviews").delete({ count: "exact" }).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to remove this review." }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Review not found or not owned by you." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
