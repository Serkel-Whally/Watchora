"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bookmark, Check, Globe2, Search, Sparkles, X, SlidersHorizontal, ChevronDown } from "lucide-react";

import { genres, type Film, type TitleKind } from "@/lib/catalogue";
import SiteHeader from "@/components/site-header";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { filterCatalogue, getFilmDecade, sortCatalogue, type CatalogueSort } from "@/lib/catalogue-utils";
import { useWatchlist } from "@/lib/use-watchlist";

const catalogue = getCatalogueProvider();

function FilmCard({ film, saved, ready, onSave }: { film: Film; saved: boolean; ready: boolean; onSave: (id: number) => void }) {
  return (
    <article className="min-w-0">
      <Link href={`/title/${film.id}`} aria-label={`View ${film.title}`} className="poster group block ring-1 ring-white/[.06] transition duration-300 hover:-translate-y-1 hover:ring-[#d9b779]/50 hover:shadow-[0_18px_48px_rgba(0,0,0,.38)]">
        <img src={film.image} alt={`${film.title} poster`} loading="lazy" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
        <span className="absolute left-3 top-3 z-10 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold tracking-[.16em] text-white/90 backdrop-blur-md">{film.kind.toUpperCase()}</span>
        <span className="absolute bottom-3 left-3 right-3 z-10"><span className="block font-[Manrope] text-base font-bold leading-tight tracking-[-.025em] text-white sm:text-lg">{film.title}</span><span className="mt-1 block text-[10px] font-medium tracking-wide text-white/65">{film.year} <span className="px-1 text-white/35">/</span> {film.country}</span></span>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-xs text-white/80">{film.year} <span className="text-white/30">·</span> {film.genre}</p><p className="mt-1 text-[11px] text-white/40">{film.country}</p></div>
        <button onClick={() => onSave(film.id)} aria-label={saved ? "Remove from watchlist" : "Add to watchlist"} aria-pressed={saved} disabled={!ready} className={`rounded-full border p-2 transition ${saved ? "border-[#d9b779] text-[#d9b779]" : "border-white/10 text-white/50 hover:border-white/40 hover:text-white"}`}>{saved ? <Check size={14} /> : <Bookmark size={14} />}</button>
      </div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [kind, setKind] = useState<TitleKind | "All">("All");
  const [country, setCountry] = useState("All");
  const [language, setLanguage] = useState("All");
  const [decade, setDecade] = useState("All");
  const [sort, setSort] = useState<CatalogueSort>("featured");
  const [showFilters, setShowFilters] = useState(false);
  const { saved, ready, toggle: toggleSave } = useWatchlist();
  const [showMood, setShowMood] = useState(false);
  const [mood, setMood] = useState("Something uplifting");

  const countries = useMemo(() => catalogue.getCountries(), []);
  const languageOptions = useMemo(() => Array.from(new Set(catalogue.getAll().map((title) => title.originalLanguage).filter((value): value is string => Boolean(value)))).sort(), []);
  const decadeOptions = useMemo(() => Array.from(new Set(catalogue.getAll().map((title) => getFilmDecade(title.year)))).sort(), []);
  const results = useMemo(() => sortCatalogue(filterCatalogue(catalogue.getAll(), { query, genre, kind, country, language, decade }), sort), [query, genre, kind, country, language, decade, sort]);
  const hasFilters = Boolean(query || genre !== "All" || kind !== "All" || country !== "All" || language !== "All" || decade !== "All" || sort !== "featured");
  const clearFilters = () => {
    setQuery(""); setGenre("All"); setKind("All"); setCountry("All");
    setLanguage("All"); setDecade("All"); setSort("featured");
  };

  const updateFilter = (update: () => void) => { update(); };

  return (
    <main className="min-h-screen">
      <SiteHeader overlay />
      <section className="hero-art relative flex min-h-[390px] items-end bg-[#15171b] pb-14 pt-28 md:min-h-[450px] md:pb-16" style={{ backgroundImage: "linear-gradient(90deg, #090a0d 0%, rgba(9,10,13,.93) 24%, rgba(9,10,13,.52) 58%, rgba(9,10,13,.2) 100%), linear-gradient(0deg, #090a0d 0%, transparent 48%), url('https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg')" }}>
        <div className="shell relative z-10 grid grid-cols-1 items-end gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-w-[690px]">
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-[#d9b779]"/><span className="eyebrow">A world of stories awaits</span></div>
            <h1 className="font-['Manrope'] text-[clamp(3.1rem,7vw,6.3rem)] font-semibold leading-[.99] tracking-[-.075em]">Explore the world of <span className="text-[#d9b779]">film.</span></h1>
            <p className="mt-7 max-w-[470px] text-[15px] leading-7 text-white/60">Browse films and series from across the world. Search the catalogue, discover new perspectives and find your next watch.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#discover" className="inline-flex items-center gap-3 rounded-full bg-[#d9b779] px-6 py-3.5 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]">Discover films & series <ArrowRight size={15}/></a>
              <button onClick={() => setShowMood(true)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[.04] px-6 py-3.5 text-xs font-semibold text-white transition hover:bg-white/10"><Sparkles size={14}/> Find by mood</button>
            </div>
          </div>
          <div className="max-w-[420px] border-l border-[#d9b779]/50 pl-4 md:ml-auto md:max-w-[270px] md:rounded-2xl md:border md:border-white/10 md:bg-black/25 md:p-5 md:backdrop-blur-md"><p className="eyebrow">The Watchora approach</p><p className="mt-3 font-['Manrope'] text-lg font-semibold leading-snug">Great stories don’t have borders.</p><p className="mt-2 text-xs leading-5 text-white/50">Discover acclaimed cinema, hidden gems and fresh perspectives from around the globe.</p><div className="mt-5 flex items-center gap-2 text-[11px] text-[#d9b779]"><Globe2 size={13}/> One world. Endless stories.</div></div>
        </div>
        <div className="absolute bottom-7 right-8 hidden items-center gap-2 text-[10px] uppercase tracking-[.2em] text-white/35 lg:flex"><span>Scroll to discover</span><ArrowDown size={13}/></div>
      </section>

      <section id="discover" className="shell scroll-mt-8 py-16 md:py-20">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="eyebrow">Explore everything</p><h2 className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] md:text-4xl">The Watchora catalogue</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Every title currently in our catalogue, together in one place. Filter by format, genre, country, language or era.</p></div>
          <label className="flex h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-white/[.035] px-4 lg:max-w-[360px]"><Search size={16} className="text-white/35"/><input value={query} onChange={(e) => updateFilter(() => setQuery(e.target.value))} placeholder="Search titles, countries, genres..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"/></label>
        </div>

        <div className="mt-5 rounded-2xl border border-white/[.08] bg-white/[.025] p-3 md:mt-7 md:p-5">
          <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} aria-controls="catalogue-filters" className="flex w-full items-center justify-between gap-3 py-1 text-left md:cursor-default"><span className="flex items-center gap-2 text-xs font-semibold text-white/70"><SlidersHorizontal size={14} className="text-[#d9b779]"/> Filter and sort titles</span><span className="flex items-center gap-2 text-[11px] text-white/45 md:hidden">{[genre !== "All",kind !== "All",country !== "All",language !== "All",decade !== "All"].filter(Boolean).length || "All"} active <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`}/></span></button>
          <div id="catalogue-filters" className={`${showFilters ? "mt-4 block" : "hidden"} md:mt-4 md:block`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select aria-label="Format" value={kind} onChange={(e) => updateFilter(() => setKind(e.target.value as TitleKind | "All"))} className="h-11 rounded-xl border border-white/10 bg-[#121419] px-3 text-xs text-white/75"><option value="All">All formats</option><option value="Film">Films</option><option value="Series">Series</option></select>
            <select aria-label="Country" value={country} onChange={(e) => updateFilter(() => setCountry(e.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#121419] px-3 text-xs text-white/75"><option value="All">All countries</option>{countries.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select aria-label="Original language" value={language} onChange={(e) => updateFilter(() => setLanguage(e.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#121419] px-3 text-xs text-white/75"><option value="All">All languages</option>{languageOptions.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select>
            <select aria-label="Release decade" value={decade} onChange={(e) => updateFilter(() => setDecade(e.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#121419] px-3 text-xs text-white/75"><option value="All">All decades</option>{decadeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select aria-label="Sort titles" value={sort} onChange={(e) => updateFilter(() => setSort(e.target.value as CatalogueSort))} className="h-11 rounded-xl border border-white/10 bg-[#121419] px-3 text-xs text-white/75"><option value="featured">Featured order</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="rating">Highest rated</option></select>
          </div>
          <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{genres.map((value) => <button key={value} onClick={() => updateFilter(() => setGenre(value))} aria-pressed={genre === value} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${genre === value ? "border-[#d9b779] bg-[#d9b779] text-[#17130d]" : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"}`}>{value}</button>)}</div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40"><span>{results.length ? `Showing all ${results.length} titles in this view` : "No matching titles"}</span><div className="flex items-center gap-4">{hasFilters && <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[#d9b779] hover:text-[#edce94]"><X size={13}/> Clear filters</button>}<span className="hidden sm:inline">Sample catalogue preview</span></div></div>
        {results.length ? <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">{results.map((film) => <FilmCard key={film.id} film={film} saved={saved.includes(film.id)} ready={ready} onSave={toggleSave}/>)}</div> : <div className="rounded-2xl border border-white/10 py-20 text-center"><p className="text-sm text-white/55">No titles found.</p><p className="mt-2 text-xs text-white/35">Try a different search or clear your filters.</p><button onClick={clearFilters} className="mt-5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-[#d9b779]">Clear filters</button></div>}
        <p className="mt-10 text-center text-[11px] text-white/30">Sample catalogue · Titles and artwork are illustrative, not a live worldwide database. Watchora does not host films or series.</p>
      </section>



      <section className="border-y border-white/[.07] bg-[#0d0f13] py-14"><div className="shell flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><p className="eyebrow">More than a catalogue</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold">Discover what the community is watching.</h2><p className="mt-2 text-sm text-white/45">Explore member reviews, thoughtful recommendations and the people behind them.</p></div><Link href="/community" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-xs font-semibold text-white/75 transition hover:border-[#d9b779] hover:text-[#d9b779]">Meet the community <ArrowRight size={14}/></Link></div></section>

      <footer className="border-t border-white/[.08] py-9"><div className="shell flex flex-col justify-between gap-5 text-xs text-white/35 sm:flex-row sm:items-center"><Link href="/" className="font-['Manrope'] text-base font-extrabold tracking-[-.06em] text-white/80">watchora<span className="text-[#d9b779]">.</span></Link><p>Discover stories. Find where to watch. Enjoy the journey.</p><p>© 2026 Watchora · Built for the love of stories.</p></div></footer>

      {showMood && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm" onClick={() => setShowMood(false)}><div className="w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#121419] p-7" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><span className="eyebrow">Mood finder</span><button onClick={() => setShowMood(false)} className="text-white/45 hover:text-white"><X size={18}/></button></div><h3 className="mt-4 font-['Manrope'] text-2xl font-semibold">What are you in the mood for?</h3><p className="mt-2 text-xs text-white/45">Pick a feeling. We’ll narrow the sample catalogue.</p><div className="mt-6 grid gap-2">{["Something uplifting","A thought-provoking story","A little suspense","A world to escape into"].map((value) => <button key={value} onClick={() => setMood(value)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${mood === value ? "border-[#d9b779] bg-[#d9b779]/10 text-[#e8c990]" : "border-white/10 text-white/65 hover:border-white/30"}`}>{value}</button>)}</div><button onClick={() => {setGenre(mood.includes("suspense") ? "Thriller" : mood.includes("escape") ? "Animation" : "Drama");setShowFilters(true);setShowMood(false);document.getElementById("discover")?.scrollIntoView({behavior:"smooth"});}} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#d9b779] py-3.5 text-xs font-bold text-[#17130d]">Show me something <ArrowRight size={14}/></button></div></div>}
    </main>
  );
}
