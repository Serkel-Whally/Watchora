"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { films } from "@/lib/catalogue";

type Preferences = { country?: string; languages?: string[]; genres?: string[] };

export default function PersonalizedDiscovery() {
  const [recent, setRecent] = useState<number[]>([]);
  const [recommendations, setRecommendations] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("watchora-recently-viewed") || "[]");
      const saved = JSON.parse(localStorage.getItem("watchora-watchlist") || "[]");
      const preferences: Preferences = JSON.parse(localStorage.getItem("watchora-preferences") || "{}");
      const validHistory = history.filter((id: number) => films.some((film) => film.id === id));
      const seeds = films.filter((film) => saved.includes(film.id) || validHistory.includes(film.id));
      const preferred = films.filter((film) =>
        (!preferences.country || preferences.country === "Worldwide" || film.country === preferences.country) &&
        (!preferences.languages?.length || preferences.languages.includes(film.originalLanguage || "")) &&
        (!preferences.genres?.length || preferences.genres.includes(film.genre))
      );
      const ranked = [...preferred, ...seeds.flatMap((seed) => films.filter((film) => film.id !== seed.id && (film.genre === seed.genre || film.country === seed.country)))];
      setRecent(validHistory.slice(0, 6));
      setRecommendations(Array.from(new Set(ranked.map((film) => film.id))).filter((id) => !validHistory.includes(id)).slice(0, 6));
    } catch {
      setRecent([]);
      setRecommendations([]);
    }
    setReady(true);
  }, []);

  if (!ready || (!recent.length && !recommendations.length)) return null;
  const renderRow = (title: string, ids: number[]) => ids.length ? <section className="shell py-10"><div className="flex items-end justify-between"><div><p className="eyebrow">Picked up where you left off</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-[-.04em]">{title}</h2></div><Link href="/preferences" className="text-xs text-[#d9b779] hover:text-[#edce94]">Tune preferences</Link></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{ids.map((id) => { const film = films.find((item) => item.id === id); return film ? <Link key={id} href={`/title/${id}`} className="group min-w-0"><div className="poster"><img src={film.image} alt={`${film.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white">{film.title}</span></div><p className="mt-2 text-[11px] text-white/40">{film.year} · {film.genre}</p></Link> : null; })}</div></section> : null;
  return <>{renderRow("Recently viewed", recent)}{renderRow("Picked for your taste", recommendations)}</>;
}
