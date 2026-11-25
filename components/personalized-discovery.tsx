"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { films } from "@/lib/catalogue";

type Preferences = { country?: string; languages?: string[]; genres?: string[] };

function rankRecommendations(history: number[], saved: number[], preferences: Preferences): number[] {
  const excluded = new Set([...history, ...saved]);
  const seeds = films.filter((film) => saved.includes(film.id) || history.includes(film.id));
  const scores = new Map<number, number>();

  for (const film of films) {
    if (excluded.has(film.id)) continue;
    let score = 0;
    if (preferences.genres?.includes(film.genre)) score += 4;
    if (preferences.languages?.includes(film.originalLanguage || "")) score += 3;
    if (preferences.country && preferences.country !== "Worldwide" && film.country === preferences.country) score += 1;
    for (const seed of seeds) {
      if (film.genre === seed.genre) score += 2;
      if (film.country === seed.country) score += 1;
    }
    if (score > 0) scores.set(film.id, score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || films.findIndex((film) => film.id === a[0]) - films.findIndex((film) => film.id === b[0]))
    .slice(0, 6)
    .map(([id]) => id);
}

export default function PersonalizedDiscovery() {
  const [recent, setRecent] = useState<number[]>([]);
  const [recommendations, setRecommendations] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("watchora-recently-viewed") || "[]");
      const saved = JSON.parse(localStorage.getItem("watchora-watchlist") || "[]");
      const preferences: Preferences = JSON.parse(localStorage.getItem("watchora-preferences") || "{}");
      const validHistory = Array.isArray(history) ? history.filter((id): id is number => Number.isInteger(id) && films.some((film) => film.id === id)) : [];
      const validSaved = Array.isArray(saved) ? saved.filter((id): id is number => Number.isInteger(id) && films.some((film) => film.id === id)) : [];
      setRecent(validHistory.slice(0, 6));
      setRecommendations(rankRecommendations(validHistory, validSaved, preferences));
    } catch {
      setRecent([]);
      setRecommendations([]);
    }
    setReady(true);
  }, []);

  if (!ready || (!recent.length && !recommendations.length)) return null;

  const renderRow = (title: string, ids: number[], eyebrow: string) => ids.length ? <section className="shell py-10"><div className="flex items-end justify-between"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-[-.04em]">{title}</h2></div><Link href="/preferences" className="text-xs text-[#d9b779] hover:text-[#edce94]">Tune preferences</Link></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{ids.map((id) => { const film = films.find((item) => item.id === id); return film ? <Link key={id} href={`/title/${id}`} className="group min-w-0"><div className="poster"><img src={film.image} alt={`${film.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white">{film.title}</span></div><p className="mt-2 text-[11px] text-white/40">{film.year} · {film.genre}</p></Link> : null; })}</div></section> : null;

  return <>{renderRow("Recently viewed", recent, "Picked up where you left off")}{renderRow("Picked for your taste", recommendations, "A little more like what you enjoy")}</>;
}
