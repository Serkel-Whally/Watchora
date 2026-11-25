"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check } from "lucide-react";

const KEY = "watchora-watchlist";

export default function WatchlistToggle({ id, title }: { id: number; title: string }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
      setSaved(Array.isArray(value) && value.includes(id));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, [id]);

  const toggle = () => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
      const current = Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item)) : [];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next.includes(id));
    } catch {
      // Keep the control usable without breaking the title page if storage is unavailable.
    }
  };

  return (
    <button onClick={toggle} disabled={!ready} aria-pressed={saved} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold transition disabled:opacity-50 ${saved ? "border-[#d9b779] bg-[#d9b779]/10 text-[#d9b779]" : "border-white/15 text-white/75 hover:border-[#d9b779] hover:text-[#d9b779]"}`}>
      {saved ? <Check size={14}/> : <Bookmark size={14}/>}
      {saved ? "Saved to watchlist" : `Save ${title}`}
    </button>
  );
}
