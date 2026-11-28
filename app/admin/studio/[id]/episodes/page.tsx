import type { Metadata } from "next";
import EpisodeManager from "@/components/episode-manager";

export const metadata: Metadata = {
  title: "Season & episodes | Watchora",
  robots: { index: false, follow: false },
};

export default async function EpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const titleId = Number(id);
  if (!Number.isSafeInteger(titleId) || titleId <= 0) {
    return <main className="min-h-screen bg-[#08090c] px-6 py-20 text-center text-white"><h1 className="text-xl font-semibold">Invalid series ID</h1></main>;
  }
  return <EpisodeManager titleId={titleId} />;
}
