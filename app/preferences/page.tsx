"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe2, Languages, Sparkles } from "lucide-react";
import { films, genres } from "@/lib/catalogue";

const languages = [
  { code: "en", label: "English" }, { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" }, { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" }, { code: "fr", label: "French" },
  { code: "es", label: "Spanish" }, { code: "ar", label: "Arabic" },
];

type Preferences = { country: string; languages: string[]; genres: string[] };
const defaults: Preferences = { country: "Worldwide", languages: [], genres: [] };
const countries = ["Worldwide", ...Array.from(new Set(films.map((film) => film.country))).sort()];

export default function PreferencesPage() {
  const [value, setValue] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("watchora-preferences") || "null");
      if (stored) setValue({ ...defaults, ...stored });
    } catch { /* Use defaults when local data is unavailable. */ }
    setReady(true);
  }, []);

  const toggle = (key: "languages" | "genres", item: string) => {
    setValue((current) => ({
      ...current,
      [key]: current[key].includes(item) ? current[key].filter((entry) => entry !== item) : [...current[key], item],
    }));
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem("watchora-preferences", JSON.stringify(value));
    setSaved(true);
  };

  return <main className="min-h-screen">
    <header className="border-b border-white/[.08]"><div className="shell flex h-[76px] items-center justify-between"><Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><Link href="/explore" className="text-xs text-white/55 hover:text-white">Discover</Link></div></header>
    <section className="shell max-w-3xl py-12 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
      <p className="eyebrow mt-9">Make discovery yours</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Your preferences.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Choose the stories and languages you enjoy. Watchora uses these choices to shape local recommendations on this device.</p>
      {!ready ? <p className="py-12 text-sm text-white/40">Loading preferences…</p> : <div className="mt-10 space-y-9">
        <section><div className="mb-4 flex items-center gap-2"><Globe2 size={16} className="text-[#d9b779]"/><h2 className="text-sm font-semibold">Discovery region</h2></div><div className="flex flex-wrap gap-2">{countries.map((country) => <button key={country} onClick={() => { setValue((current) => ({ ...current, country })); setSaved(false); }} className={`rounded-full border px-4 py-2.5 text-xs transition ${value.country === country ? "border-[#d9b779] bg-[#d9b779]/10 text-[#e8c990]" : "border-white/10 text-white/55 hover:border-white/30"}`}>{country}</button>)}</div></section>
        <section><div className="mb-4 flex items-center gap-2"><Languages size={16} className="text-[#d9b779]"/><h2 className="text-sm font-semibold">Preferred languages</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{languages.map((language) => <button key={language.code} onClick={() => toggle("languages", language.code)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-xs transition ${value.languages.includes(language.code) ? "border-[#d9b779]/70 bg-[#d9b779]/10 text-[#e8c990]" : "border-white/10 text-white/55 hover:border-white/30"}`}>{language.label}{value.languages.includes(language.code) && <Check size={13}/>}</button>)}</div><p className="mt-2 text-[11px] text-white/30">Leave empty to include every language.</p></section>
        <section><div className="mb-4 flex items-center gap-2"><Sparkles size={16} className="text-[#d9b779]"/><h2 className="text-sm font-semibold">Genres you enjoy</h2></div><div className="flex flex-wrap gap-2">{genres.filter((genre) => genre !== "All").map((genre) => <button key={genre} onClick={() => toggle("genres", genre)} className={`rounded-full border px-4 py-2.5 text-xs transition ${value.genres.includes(genre) ? "border-[#d9b779] bg-[#d9b779]/10 text-[#e8c990]" : "border-white/10 text-white/55 hover:border-white/30"}`}>{genre}</button>)}</div><p className="mt-2 text-[11px] text-white/30">Choose as many as you like. With none selected, recommendations stay broad.</p></section>
        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-6"><button onClick={save} className="rounded-full bg-[#d9b779] px-6 py-3 text-xs font-bold text-[#17130d] hover:bg-[#edce94]">Save preferences</button>{saved && <span className="text-xs text-[#d9b779]">Preferences saved on this device.</span>}</div>
      </div>}
      <p className="mt-10 text-[11px] leading-5 text-white/30">No account or paid service is required. Preferences stay in this browser and are not synced across devices.</p>
    </section>
  </main>;
}
