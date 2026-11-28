import { notFound } from "next/navigation";
import PlaybackPlayer from "@/components/playback-player";
import { getPublicTitleById } from "@/lib/studio-catalogue";
import { createPlaybackSession } from "@/lib/playback";


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = await getPublicTitleById(Number(id));
  return { title: title ? `Watch ${title.title} — Watchora` : "Watch — Watchora" };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = await getPublicTitleById(Number(id));
  if (!title) notFound();
  const playback = await createPlaybackSession(title.studioId ?? title.id);
  return <PlaybackPlayer title={title} playback={playback} />;
}
