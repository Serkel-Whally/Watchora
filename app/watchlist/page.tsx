"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { films } from "@/lib/catalogue";

export default function WatchlistPage() {
  const [saved, setSaved] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("watchora-watchlist") || "[]")); } catch { setSaved([]); }
    setReady(true);
  }, []);
  const remove = (id:number) => {
    const next=saved.filter(value=>value!==id);
    setSaved(next);
    localStorage.setItem("watchora-watchlist",JSON.stringify(next));
  };
  const items=films.filter(f=>saved.includes(f.id));
  return <main className="min-h-screen">
    <header className="border-b border-white/[.08]"><div className="shell flex h-[76px] items-center justify-between"><Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><Link href="/explore" className="text-xs text-white/55 hover:text-white">Explore</Link></div></header>
    <section className="shell py-12 md:py-16"><Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
      <p className="eyebrow mt-9">Your personal collection</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Your watchlist.</h1><p className="mt-3 text-sm text-white/45">Keep the stories you want to come back to.</p>
      {!ready ? <p className="py-20 text-sm text-white/40">Loading your watchlist…</p> : items.length ? <><div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">{items.map(f=><article key={f.id}><Link href={`/title/${f.id}`} className="poster group block"><img src={f.image} alt={`${f.title} poster`} loading="lazy" onError={e=>{e.currentTarget.style.opacity="0"}}/><span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold">{f.title}</span></Link><div className="mt-3 flex items-center justify-between gap-2"><div><p className="text-xs text-white/65">{f.year} · {f.genre}</p><p className="mt-1 text-[11px] text-white/35">{f.country}</p></div><button onClick={()=>remove(f.id)} className="rounded-full border border-white/10 p-2 text-white/50 hover:border-[#d9b779] hover:text-[#d9b779]" aria-label={`Remove ${f.title} from watchlist`}><Bookmark size={14} fill="currentColor"/></button></div></article>)}</div><p className="mt-8 text-[11px] text-white/30">Saved on this device only. Sign-in and cross-device sync can be added later.</p></> : <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.025] px-6 py-16 text-center"><Bookmark size={25} className="mx-auto text-[#d9b779]"/><h2 className="mt-5 font-['Manrope'] text-xl font-semibold">Your list is waiting for a story.</h2><p className="mt-2 text-sm text-white/40">Save films and series while exploring to keep them close.</p><Link href="/explore" className="mt-6 inline-flex rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Explore titles</Link></div>}
    </section>
  </main>;
}
