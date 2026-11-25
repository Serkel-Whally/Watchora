"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { genres, type TitleKind } from "@/lib/catalogue";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { filterCatalogue, paginateCatalogue, sortCatalogue, type CatalogueSort } from "@/lib/catalogue-utils";

const WATCHLIST_KEY = "watchora-watchlist";
const PAGE_SIZE = 6;
const catalogue = getCatalogueProvider();

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [kind, setKind] = useState<TitleKind | "All">("All");
  const [country, setCountry] = useState("All");
  const [language, setLanguage] = useState("All");
  const [sort, setSort] = useState<CatalogueSort>("featured");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
      if (Array.isArray(stored)) setSaved(stored.filter((id): id is number => Number.isInteger(id)));
    } catch {
      setSaved([]);
    }
    setReady(true);
  }, []);

  const countries = useMemo(() => catalogue.getCountries(), []);
  const languageOptions = useMemo(() => Array.from(new Set(catalogue.getAll().map((title) => title.originalLanguage).filter((value): value is string => Boolean(value)))).sort(), []);
  const results = useMemo(() => sortCatalogue(filterCatalogue(catalogue.getAll(), { query, genre, kind, country, language }), sort), [genre, kind, country, language, query, sort]);
  const pagination = useMemo(() => paginateCatalogue(results, page, PAGE_SIZE), [results, page]);
  const hasFilters = Boolean(query || genre !== "All" || kind !== "All" || country !== "All" || language !== "All" || sort !== "featured");

  useEffect(() => {
    if (page !== pagination.page) setPage(pagination.page);
  }, [page, pagination.page]);

  const clearFilters = () => {
    setQuery("");
    setGenre("All");
    setKind("All");
    setCountry("All");
    setLanguage("All");
    setSort("featured");
    setPage(1);
  };

  const toggleSave = (id: number) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  return <main className="min-h-screen">
    <header className="border-b border-white/[.08]"><div className="shell flex h-[76px] items-center justify-between"><Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><nav className="flex items-center gap-5 text-xs text-white/60"><Link href="/" className="hover:text-white">Home</Link><Link href="/watchlist" className="hover:text-white">Watchlist{ready && saved.length > 0 ? ` (${saved.length})` : ""}</Link></nav></div></header>
    <section className="shell py-12 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
      <p className="eyebrow mt-9">Worldwide discovery</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Explore stories.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Find films and series by title, genre, format or country. This is an illustrative sample collection, not a live worldwide database. Language filters use original-language metadata where available.</p>
      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_150px_150px_150px]">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-4"><Search size={16} className="shrink-0 text-white/35"/><input value={query} onChange={e => {setQuery(e.target.value);setPage(1);}} placeholder="Search titles, countries, genres..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"/></label>
        <select aria-label="Format" value={kind} onChange={e => {setKind(e.target.value as TitleKind | "All");setPage(1);}} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option value="All">All formats</option><option value="Film">Films</option><option value="Series">Series</option></select>
        <select aria-label="Country" value={country} onChange={e => {setCountry(e.target.value);setPage(1);}} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option value="All">All countries</option>{countries.map(value => <option key={value} value={value}>{value}</option>)}</select>
        <select aria-label="Original language" value={language} onChange={e => {setLanguage(e.target.value);setPage(1);}} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option value="All">All languages</option>{languageOptions.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select>
        <select aria-label="Sort titles" value={sort} onChange={e => {setSort(e.target.value as CatalogueSort);setPage(1);}} className="h-12 rounded-xl border border-white/10 bg-[#121419] px-3 text-sm text-white/75"><option value="featured">Featured</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="rating">Highest rated</option></select>
      </div>
      <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">{genres.map(g => <button key={g} onClick={() => {setGenre(g);setPage(1);}} aria-pressed={genre === g} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${genre === g ? "border-[#d9b779] bg-[#d9b779] text-[#17130d]" : "border-white/10 text-white/55 hover:border-white/30"}`}>{g}</button>)}</div>
      <div className="mt-7"><div className="mb-3 flex items-center justify-between gap-3"><p className="eyebrow">Discover by country</p><span className="text-[10px] text-white/30">Countries represented in this preview</span></div><div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">{countries.map(value => <button key={value} onClick={() => {setCountry(value);setPage(1);}} aria-pressed={country === value} className={country === value ? "shrink-0 rounded-full border border-[#d9b779] bg-[#d9b779]/10 px-3.5 py-2 text-[11px] text-[#e8c990]" : "shrink-0 rounded-full border border-white/10 px-3.5 py-2 text-[11px] text-white/50 hover:border-white/30 hover:text-white"}>{value}</button>)}</div></div>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-white/35"><span>{pagination.totalItems ? `Showing ${pagination.startIndex}–${pagination.endIndex} of ${pagination.totalItems} sample titles` : "0 sample titles"}</span>{hasFilters ? <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[#d9b779] hover:text-[#edce94]"><X size={13}/> Clear filters</button> : <span>Catalogue preview</span>}</div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{pagination.items.map(f => <article key={f.id}>
        <div className="poster group"><Link href={`/title/${f.id}`} aria-label={`View ${f.title}`} className="absolute inset-0 z-[1]"><img src={f.image} alt={`${f.title} poster`} loading="lazy" onError={e => {e.currentTarget.style.opacity = "0";}}/></Link><span className="absolute left-3 top-3 z-[2] rounded bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wider">{f.kind.toUpperCase()}</span><Link href={`/title/${f.id}`} className="absolute bottom-3 left-3 right-12 z-[2] text-sm font-semibold text-white">{f.title}</Link><button onClick={() => toggleSave(f.id)} disabled={!ready} aria-label={saved.includes(f.id) ? `Remove ${f.title} from watchlist` : `Save ${f.title} to watchlist`} aria-pressed={saved.includes(f.id)} className={`absolute bottom-2.5 right-2.5 z-[3] rounded-full border p-2 backdrop-blur-sm transition disabled:opacity-50 ${saved.includes(f.id) ? "border-[#d9b779] bg-black/75 text-[#d9b779]" : "border-white/25 bg-black/55 text-white/80 hover:border-[#d9b779] hover:text-[#d9b779]"}`}><Bookmark size={14} fill={saved.includes(f.id) ? "currentColor" : "none"}/></button></div>
        <div className="mt-3 flex justify-between gap-2 text-xs text-white/45"><span>{f.year} · {f.genre}</span><span>★ {f.rating}</span></div><p className="mt-1 text-[11px] text-white/30">{f.country}</p>
      </article>)}</div>
      {results.length === 0 && <div className="py-24 text-center"><p className="text-sm text-white/50">No titles found.</p><p className="mt-2 text-xs text-white/30">Try a different search or clear your filters.</p><button onClick={clearFilters} className="mt-5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-[#d9b779]">Clear filters</button></div>}
      {pagination.pageCount > 1 && <nav aria-label="Catalogue pages" className="mt-12 flex items-center justify-center gap-4"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.page === 1} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/70 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={14}/> Previous</button><span className="text-xs tabular-nums text-white/45">Page {pagination.page} of {pagination.pageCount}</span><button onClick={() => setPage(p => Math.min(pagination.pageCount, p + 1))} disabled={pagination.page === pagination.pageCount} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/70 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30">Next <ChevronRight size={14}/></button></nav>}
      <p className="mt-12 text-center text-[11px] text-white/25">Sample data only. Streaming availability is not currently provided. Your watchlist is stored on this device.</p>
    </section>
  </main>;
}
