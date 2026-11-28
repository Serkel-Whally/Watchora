import { NextResponse } from "next/server";
import { getPublishedStudioTitles } from "@/lib/studio-catalogue";

export const dynamic = "force-dynamic";

export async function GET() {
  const titles = await getPublishedStudioTitles();
  return NextResponse.json({ titles }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
