"use client";

import { Bookmark, Check } from "lucide-react";
import { useWatchlist } from "@/lib/use-watchlist";

export default function WatchlistToggle({ id, title }: { id: number; title: string }) {
  const { saved, ready, toggle } = useWatchlist();
  const isSaved = saved.includes(id);

  return (
    <button onClick={() => toggle(id)} disabled={!ready} aria-pressed={isSaved} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold transition disabled:opacity-50 ${isSaved ? "border-[#d9b779] bg-[#d9b779]/10 text-[#d9b779]" : "border-white/15 text-white/75 hover:border-[#d9b779] hover:text-[#d9b779]"}`}>
      {isSaved ? <Check size={14}/> : <Bookmark size={14}/>}
      {isSaved ? "Saved to watchlist" : `Save ${title}`}
    </button>
  );
}
