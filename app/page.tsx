"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Bookmark, Check, Clapperboard, Menu, Search, Sparkles, X } from "lucide-react";

import { films, genres, type Film } from "@/lib/catalogue";
import PersonalizedDiscovery from "@/components/personalized-discovery";
import { getHomepageCollections, getHomepageFeaturedTitles, homepageEditorial } from "@/lib/editorial";

function FilmCard({ film, saved, onSave, onOpen }: { film: Film; saved: boolean; onSave: (id: number) => void; onOpen: (film: Film) => void }) {
  return (
    <article className="min-w-0">
      <button className="poster group block w-full text-left" onClick={() => onOpen(film)} aria-label={`View ${film.title}`}>
        <img src={film.image} alt={`${film.title} poster`} loading="lazy" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
        <span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">{film.kind.toUpperCase()}</span>
        <span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold leading-tight text-white">{film.title}</span>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-xs text-white/80">{film.year} <span className="text-white/30">·</span> {film.genre}</p><p className="mt-1 text-[11px] text-white/40">{film.country}</p></div>
        <button onClick={() => onSave(film.id)} aria-label={saved ? "Remove from watchlist" : "Add to watchlist"} className={`rounded-full border p-2 transition ${saved ? "border-[#d9b779] text-[#d9b779]" : "border-white/10 text-white/50 hover:border-white/40 hover:text-white"}`}>{saved ? <Check size={14} /> : <Bookmark size={14} />}</button>
      </div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [saved, setSaved] = useState<number[]>([]);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("watchora-watchlist") || "[]")); } catch { setSaved([]); } }, []);
  const [activeFilm, setActiveFilm] = useState<Film | null>(null);
  const [showMood, setShowMood] = useState(false);
  const [mood, setMood] = useState("Something uplifting");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!mobileMenu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenu]);
  const filtered = useMemo(() => films.filter((f) => (genre === "All" || f.genre === genre) && (f.title.toLowerCase().includes(query.toLowerCase()) || f.country.toLowerCase().includes(query.toLowerCase()))), [genre, query]);
  const featuredTitles = useMemo(() => getHomepageFeaturedTitles(), []);
  const homepageCollections = useMemo(() => getHomepageCollections(), []);
  const collectionTones = { warm: "from-[#44372c] to-[#161719]", cool: "from-[#243c42] to-[#14191c]", rose: "from-[#493039] to-[#171518]", gold: "from-[#62502f] to-[#30291d]" };
  const toggleSave = (id: number) => setSaved((current) => { const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]; localStorage.setItem("watchora-watchlist", JSON.stringify(next)); return next; });

  return (
    <main className="min-h-screen">
      <header className="absolute left-0 right-0 top-0 z-50 border-b border-white/[.08] bg-black/20 backdrop-blur-md">
        <div className="shell flex h-[76px] items-center justify-between">
          <Link href="#" className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[#d9b779]/40 bg-[#d9b779]/10 text-[#d9b779]"><Clapperboard size={18}/></span><span className="font-['Manrope'] text-[19px] font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></span></Link>
          <nav className="hidden items-center gap-9 text-[13px] text-white/65 md:flex"><Link className="text-white" href="/explore">Discover</Link><Link href="/preferences" className="transition hover:text-white">Preferences</Link><Link href="/watchlist" className="transition hover:text-white">Watchlist</Link><Link href="/collections" className="transition hover:text-white">Collections</Link><button onClick={() => setShowMood(true)} className="transition hover:text-white">Mood finder</button></nav>
          <div className="hidden items-center gap-5 md:flex"><button onClick={() => document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-[#d9b779] px-5 py-2.5 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]">Explore films</button></div>
          <button className="relative z-[70] text-white md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenu} aria-controls="watchora-mobile-menu">{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
        {<div className={`fixed inset-0 z-[60] md:hidden ${mobileMenu ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!mobileMenu}><button aria-label="Close navigation menu" tabIndex={mobileMenu ? 0 : -1} onClick={() => setMobileMenu(false)} className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${mobileMenu ? "opacity-100" : "opacity-0"}`}/><aside id="watchora-mobile-menu" role="dialog" aria-modal="true" className={`absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col border-l border-white/10 bg-[#0b0c0f] px-7 pb-10 pt-7 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${mobileMenu ? "translate-x-0" : "translate-x-full"}`} aria-label="Mobile navigation"><div className="flex items-center justify-between border-b border-white/10 pb-7"><Link href="/" onClick={() => setMobileMenu(false)} className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><button onClick={() => setMobileMenu(false)} aria-label="Close menu" className="rounded-full border border-white/10 p-2 text-white/70"><X size={18}/></button></div><nav className="mt-8 flex flex-col items-stretch gap-1 text-[15px] text-white/75"><Link className="rounded-xl px-4 py-4 transition hover:bg-white/[.06] hover:text-white" href="/explore" onClick={() => setMobileMenu(false)}>Discover</Link><Link className="rounded-xl px-4 py-4 transition hover:bg-white/[.06] hover:text-white" href="/collections" onClick={() => setMobileMenu(false)}>Collections</Link><Link className="rounded-xl px-4 py-4 transition hover:bg-white/[.06] hover:text-white" href="/preferences" onClick={() => setMobileMenu(false)}>Preferences</Link><Link className="rounded-xl px-4 py-4 transition hover:bg-white/[.06] hover:text-white" href="/watchlist" onClick={() => setMobileMenu(false)}>Watchlist</Link><button className="rounded-xl px-4 py-4 text-left transition hover:bg-white/[.06] hover:text-white" onClick={() => {setShowMood(true);setMobileMenu(false);}}>Mood finder</button></nav><div className="mt-auto border-t border-white/10 pt-6"><p className="eyebrow">A world of stories awaits</p><p className="mt-2 text-xs leading-5 text-white/40">Discover something worth watching, from every corner of the world.</p><Link href="/explore" onClick={() => setMobileMenu(false)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d9b779]">Explore titles <ArrowRight size={14}/></Link></div></aside></div>}
      </header>

      <section className="hero-art relative flex min-h-[690px] items-end bg-[#15171b] pb-20 pt-32 md:min-h-[760px]" style={{ backgroundImage: "linear-gradient(90deg, #090a0d 0%, rgba(9,10,13,.93) 24%, rgba(9,10,13,.52) 58%, rgba(9,10,13,.2) 100%), linear-gradient(0deg, #090a0d 0%, transparent 48%), url('https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg')" }}>
        <div className="shell relative z-10 grid grid-cols-1 items-end gap-12 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-w-[690px]"><div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-[#d9b779]"/><span className="eyebrow">A world of stories awaits</span></div><h1 className="font-['Manrope'] text-[clamp(3.1rem,7vw,6.3rem)] font-semibold leading-[.99] tracking-[-.075em]">Find your next <span className="text-[#d9b779]">favourite.</span></h1><p className="mt-7 max-w-[470px] text-[15px] leading-7 text-white/60">A universe of films and series, curated from every corner of the world. Less scrolling. Better watching.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/collections" className="inline-flex items-center gap-3 rounded-full bg-[#d9b779] px-6 py-3.5 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]">Explore the collection <ArrowRight size={15}/></Link><button onClick={() => setShowMood(true)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[.04] px-6 py-3.5 text-xs font-semibold text-white transition hover:bg-white/10"><Sparkles size={14}/> Find by mood</button></div>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur-md md:block"><p className="eyebrow">The Watchora approach</p><p className="mt-3 font-['Manrope'] text-lg font-semibold leading-snug">Great stories don’t have borders.</p><p className="mt-2 text-xs leading-5 text-white/50">Discover acclaimed cinema, hidden gems and fresh perspectives from around the globe.</p><div className="mt-5 flex items-center gap-2 text-[11px] text-[#d9b779]"><Globe2 size={13}/> One world. Endless stories.</div></div>
        </div>
        <div className="absolute bottom-8 right-8 hidden items-center gap-2 text-[10px] uppercase tracking-[.2em] text-white/35 lg:flex"><span>Scroll to discover</span><ArrowDown size={13}/></div>
      </section>

      <PersonalizedDiscovery />

      <section className="shell py-16 md:py-20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">{homepageEditorial.featuredEyebrow}</p><h2 className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">{homepageEditorial.featuredHeading}</h2><p className="mt-3 text-sm text-white/45">{homepageEditorial.featuredDescription}</p></div><Link href="/explore" className="inline-flex items-center gap-2 text-xs text-[#d9b779] hover:text-[#edce94]">Browse everything <ArrowRight size={14}/></Link></div>
        <div className="hide-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-5">{featuredTitles.map((film) => <div key={film.id} className="w-[min(43vw,210px)] shrink-0 snap-start sm:w-[220px]"><FilmCard film={film} saved={saved.includes(film.id)} onSave={toggleSave} onOpen={() => { window.location.href = `/title/${film.id}`; }}/></div>)}</div>
        {featuredTitles.length === 0 && <p className="mt-6 text-sm text-white/40">Featured titles will appear here as the catalogue is updated.</p>}
      </section>

      <section id="discover" className="shell scroll-mt-10 py-20">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="eyebrow">Your next watch starts here</p><h2 className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] md:text-4xl">Explore the world of film</h2><p className="mt-3 text-sm text-white/45">A handpicked sample to get your discovery started.</p></div>
          <label className="flex h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-white/[.035] px-4 md:max-w-[310px]"><Search size={16} className="text-white/35"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles or countries..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"/></label>
        </div>
        <div className="hide-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">{genres.map((g) => <button key={g} onClick={() => setGenre(g)} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${genre === g ? "border-[#d9b779] bg-[#d9b779] text-[#17130d]" : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"}`}>{g}</button>)}</div>
        <div className="hide-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-5">{filtered.map((film) => <div key={film.id} className="w-[min(43vw,210px)] shrink-0 snap-start sm:w-[220px]"><FilmCard film={film} saved={saved.includes(film.id)} onSave={toggleSave} onOpen={(film) => { window.location.href = `/title/${film.id}`; }}/></div>)}</div>
        {filtered.length === 0 && <div className="py-20 text-center text-sm text-white/45">No titles match that search. Try another title or country.</div>}
        <p className="mt-8 text-center text-[11px] text-white/30">Sample catalogue · Titles and artwork are illustrative and not a live catalogue.</p>
      </section>

      <section id="collections" className="border-y border-white/[.07] bg-[#0d0f13] py-20">
        <div className="shell"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Curated for curious minds</p><h2 className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">Stories beyond borders</h2></div><Link href="/collections" className="inline-flex items-center gap-2 text-xs text-[#d9b779] transition hover:text-[#edce94]">View all collections <ArrowRight size={14}/></Link></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {homepageCollections.map((collection) => <Link key={collection.slug} href={`/collections/${collection.slug}`} className={`group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${collectionTones[collection.tone]} p-7 transition hover:-translate-y-1 hover:border-[#d9b779]/40`}><span className="eyebrow">{collection.number} / Curated collection</span><span className="flex items-end justify-between gap-3"><span><span className="block font-['Manrope'] text-2xl font-semibold">{collection.title}</span><span className="mt-2 block text-xs leading-5 text-white/45">{collection.description}</span></span><ArrowRight className="shrink-0 transition group-hover:translate-x-1"/></span></Link>)}
          </div>
        </div>
      </section>

      <section className="shell py-20"><div className="rounded-2xl border border-[#d9b779]/20 bg-[radial-gradient(circle_at_85%_10%,rgba(217,183,121,.13),transparent_35%),#111318] px-7 py-12 md:px-14 md:py-16"><div className="max-w-[650px]"><span className="eyebrow">A little less scrolling</span><h2 className="mt-4 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] md:text-5xl">Tell us how you feel.<br/><span className="text-[#d9b779]">We’ll find the story.</span></h2><p className="mt-5 max-w-[480px] text-sm leading-6 text-white/50">Choose a mood and let discovery take a different direction. Your next favourite might surprise you.</p><button onClick={() => setShowMood(true)} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#d9b779] px-6 py-3.5 text-xs font-bold text-[#17130d] hover:bg-[#edce94]"><Sparkles size={15}/> Open mood finder <ArrowRight size={14}/></button></div></div></section>

      <footer className="border-t border-white/[.08] py-9"><div className="shell flex flex-col justify-between gap-5 text-xs text-white/35 sm:flex-row sm:items-center"><Link href="#" className="font-['Manrope'] text-base font-extrabold tracking-[-.06em] text-white/80">watchora<span className="text-[#d9b779]">.</span></Link><p>Discover stories. Find where to watch. Enjoy the journey.</p><p>© 2026 Watchora · Built for the love of stories.</p></div></footer>

      {activeFilm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm" onClick={() => setActiveFilm(null)}><div className="relative grid w-full max-w-[650px] gap-6 rounded-2xl border border-white/10 bg-[#121419] p-6 sm:grid-cols-[150px_1fr]" onClick={(e) => e.stopPropagation()}><button onClick={() => setActiveFilm(null)} className="absolute right-4 top-4 text-white/50 hover:text-white"><X size={19}/></button><div className="poster hidden sm:block"><img src={activeFilm.image} alt=""/></div><div className="pr-7"><p className="eyebrow">{activeFilm.kind} · {activeFilm.country}</p><h3 className="mt-3 font-['Manrope'] text-2xl font-bold">{activeFilm.title}</h3><p className="mt-2 text-xs text-white/40">{activeFilm.year} · {activeFilm.genre} · Rating {activeFilm.rating}</p><p className="mt-5 text-sm leading-6 text-white/65">{activeFilm.description}</p><button onClick={() => toggleSave(activeFilm.id)} className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#d9b779]/50 px-4 py-2.5 text-xs text-[#d9b779]">{saved.includes(activeFilm.id) ? <Check size={14}/> : <Bookmark size={14}/>} {saved.includes(activeFilm.id) ? "Saved to watchlist" : "Add to watchlist"}</button><p className="mt-5 text-[10px] text-white/30">Discovery preview only. Watch links will be added when a licensed availability source is selected.</p></div></div></div>}

      {showMood && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm" onClick={() => setShowMood(false)}><div className="w-full max-w-[430px] rounded-2xl border border-white/10 bg-[#121419] p-7" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><span className="eyebrow">Mood finder</span><button onClick={() => setShowMood(false)} className="text-white/45 hover:text-white"><X size={18}/></button></div><h3 className="mt-4 font-['Manrope'] text-2xl font-semibold">What are you in the mood for?</h3><p className="mt-2 text-xs text-white/45">Pick a feeling. We’ll narrow the sample catalogue.</p><div className="mt-6 grid gap-2">{["Something uplifting","A thought-provoking story","A little suspense","A world to escape into"].map((m) => <button key={m} onClick={() => setMood(m)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${mood === m ? "border-[#d9b779] bg-[#d9b779]/10 text-[#e8c990]" : "border-white/10 text-white/65 hover:border-white/30"}`}>{m}</button>)}</div><button onClick={() => {setGenre(mood.includes("suspense") ? "Thriller" : mood.includes("escape") ? "Animation" : "Drama");setShowMood(false);document.getElementById("discover")?.scrollIntoView({behavior:"smooth"});}} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#d9b779] py-3.5 text-xs font-bold text-[#17130d]">Show me something <ArrowRight size={14}/></button></div></div>}
    </main>
  );
}
