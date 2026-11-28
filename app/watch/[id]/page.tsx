import { notFound } from "next/navigation";
import PlaybackPlayer from "@/components/playback-player";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { createPlaybackSession } from "@/lib/playback";

const catalogue = getCatalogueProvider();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = catalogue.getById(Number(id));
  return { title: title ? `Watch ${title.title} — Watchora` : "Watch — Watchora" };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = catalogue.getById(Number(id));
  if (!title) notFound();
  const playback = await createPlaybackSession(title.id);
  return <PlaybackPlayer title={title} playback={playback} />;
}
