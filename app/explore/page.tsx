"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Search } from "lucide-react";
import { films, genres } from "@/lib/catalogue";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [kind, setKind] = useState("All");
  const [sort, setSort] = useState("featured");
  const results = useMemo(() => {
    const filtered = films.filter((film) =>
      (genre === "All" || film.genre === genre) &&
      (kind === "All" || film.kind === kind) &&
      [film.title, film.country, film.genre].some((value) => value.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === "newest") return [...filtered].sort((a,b) => b.year-a.year);
    if (sort === "oldest") return [...filtered].sort((a,b) => a.year-b.year);
    if (sort === "rating") return [...filtered].sort((a,b) => Number(b.rating)-Number(a.rating));
    return filtered;
  }, [genre, kind, query, sort]);

  return <main className="min-h-screen">
    <header className="border-b border-white/[.08]"><div className="shell flex h-[76px] items-center justify-between"><Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><nav className="flex items-center gap-5 text-xs text-white/60"><Link href="/" className="hover:text-white">Home</Link><Link href="/watchlist" className="hover:text-white">Watchlist</Link></nav></div></header>
    <section className="shell py-12 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
      <p className="eyebrow mt-9">Worldwide discovery</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Explore stories.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Search the Watchora sample catalogue by title, country or genre. This is an illustrative collection, not a live worldwide database.</p>
      <div className="mt-9 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-4"><Search size={16} className="text-white/35"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles, countries, genres..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"/></label>
        <select value={kind} onChange={e=>setKind(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option>All</option><option>Film</option><option>Series</option></select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option value="featured">Featured</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="rating">Highest rated</option></select>
      </div>
      <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">{genres.map(g=><button key={g} onClick={()=>setGenre(g)} className={`shrink-0 rounded-full border px-4 py-2 text-xs ${genre===g?"border-[#d9b779] bg-[#d9b779] text-[#17130d]":"border-white/10 text-white/55 hover:border-white/30"}`}>{g}</button>)}</div>
      <div className="mt-7 flex items-center justify-between text-xs text-white/35"><span>{results.length} sample {results.length===1?"title":"titles"}</span><span>Catalogue preview</span></div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{results.map(f=><article key={f.id}><Link href={`/title/${f.id}`} className="poster group block"><img src={f.image} alt={`${f.title} poster`} loading="lazy" onError={e=>{e.currentTarget.style.opacity="0"}}/><span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wider">{f.kind.toUpperCase()}</span><span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold">{f.title}</span></Link><div className="mt-3 flex justify-between text-xs text-white/45"><span>{f.year} · {f.genre}</span><span>★ {f.rating}</span></div><p className="mt-1 text-[11px] text-white/30">{f.country}</p></article>)}</div>
      {results.length===0&&<div className="py-24 text-center text-sm text-white/40">No titles found. Try a different search or filter.</div>}
      <p className="mt-12 text-center text-[11px] text-white/25">Sample data only. Streaming availability is not currently provided.</p>
    </section>
  </main>;
}
