import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Globe2, Languages, Star, Sparkles, Play } from "lucide-react";
import WatchlistToggle from "@/components/watchlist-toggle";
import TitleViewTracker from "@/components/title-view-tracker";
import TitleReviews from "@/components/title-reviews";
import { getPublicCatalogue, getPublicTitleById, getPublishedStudioEpisodes } from "@/lib/studio-catalogue";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = await getPublicTitleById(Number(id));
  return {
    title: film ? `${film.title} — Watchora` : "Title not found — Watchora",
    description: film?.description,
  };
}

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = await getPublicTitleById(Number(id));
  if (!film) notFound();

  const episodes = film.studioId && film.kind === "Series" ? await getPublishedStudioEpisodes(film.studioId) : [];
  const episodeSeasons = [...new Set(episodes.map((episode) => episode.season_number))];
  const related = (await getPublicCatalogue())
    .filter((item) => item.id !== film.id && (item.genre === film.genre || item.country === film.country))
    .slice(0, 4);

  return (
    <main className="min-h-screen">
      <TitleViewTracker id={film.id} />
      <SiteHeader />

      <section className="relative isolate overflow-hidden border-b border-white/[.08]">
        <div className="absolute inset-0 -z-20 scale-110 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url("${film.image}")` }}/>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#090a0d]/55 via-[#090a0d]/90 to-[#090a0d]"/>
        <div className="shell pb-12 pt-8 md:pb-16 md:pt-10">
          <Link href="/#discover" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to discovery</Link>
          <div className="mt-8 grid items-center gap-8 md:mt-12 md:grid-cols-[minmax(220px,300px)_1fr] md:gap-14 lg:grid-cols-[320px_1fr] lg:gap-16">
            <div className="mx-auto w-full max-w-[280px] md:max-w-none">
              <div className="poster shadow-[0_28px_80px_rgba(0,0,0,.55)] ring-1 ring-white/10">
                <img src={film.image} alt={`${film.title} poster`} />
                <span className="absolute left-3 top-3 z-10 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-[9px] font-bold tracking-[.16em]">{film.kind.toUpperCase()}</span>
              </div>
              <p className="mt-3 text-center text-[10px] uppercase tracking-[.16em] text-white/30">Watchora title guide</p>
            </div>

            <div className="py-2 md:py-7">
              <p className="eyebrow inline-flex items-center gap-2"><Sparkles size={12}/> A story worth discovering</p>
              <h1 className="mt-4 max-w-3xl font-['Manrope'] text-4xl font-semibold leading-[1.05] tracking-[-.065em] sm:text-5xl lg:text-6xl">{film.title}</h1>
              {film.originalTitle && <p className="mt-3 text-sm text-white/40">{film.originalTitle}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                {[film.year > 0 ? String(film.year) : "Release year TBA", film.kind, film.genre, film.country].map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">{item}</span>)}
                {film.runtimeMinutes && <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 py-2"><Clock3 size={12}/> {film.runtimeMinutes} min</span>}
                {film.seasonCount && <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2">{film.seasonCount} seasons</span>}
              </div>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-white/65 md:text-base md:leading-8">{film.description}</p>
              {film.originalLanguage && <p className="mt-5 inline-flex items-center gap-2 text-xs text-white/40"><Languages size={13}/> Original language: {film.originalLanguage.toUpperCase()}</p>}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={`/watch/${film.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]"><Play size={14} fill="currentColor"/> Watch now</Link>
                <WatchlistToggle id={film.id} title={film.title}/>
                <Link href="#reviews" className="rounded-full border border-white/15 bg-white/[.04] px-5 py-3 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:bg-white/[.08] hover:text-white">Read & write reviews</Link>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Community signal</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/80"><Star size={14} className="text-[#d9b779]"/> {film.rating} <span className="text-[10px] font-normal text-white/35">illustrative sample rating</span></p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Viewing information</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/80"><Globe2 size={14} className="text-[#d9b779]"/> {film.country}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {film.kind === "Series" && film.studioId && <section className="border-b border-white/[.08] bg-[#0d0f13] py-12 md:py-16">
        <div className="shell">
          <p className="eyebrow">Watch the story unfold</p>
          <h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-[-.04em]">Episodes & seasons</h2>
          {episodes.length === 0 ? <p className="mt-4 text-sm text-white/40">Episodes will appear here when they are published by Watchora.</p> : <div className="mt-7 space-y-7">
            {episodeSeasons.map((season) => <section key={season}>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Season {season}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {episodes.filter((episode) => episode.season_number === season).map((episode) => <article key={episode.id} className="flex gap-4 rounded-2xl border border-white/[.08] bg-black/20 p-4">
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[.05] font-mono text-xs text-[#d9b779]">E{String(episode.episode_number).padStart(2, "0")}</div>
                  <div className="min-w-0"><h4 className="text-sm font-semibold text-white">{episode.title}</h4><p className="mt-1 text-xs leading-5 text-white/45">{episode.description || "Episode details coming soon."}</p>{episode.runtime_minutes && <p className="mt-2 text-[10px] text-white/30">{episode.runtime_minutes} min</p>}</div>
                </article>)}
              </div>
            </section>)}
          </div>}
        </div>
      </section>}

      <TitleReviews titleId={film.id} title={film.title} />

      {related.length > 0 && <section className="border-t border-white/[.08] bg-[#0d0f13] py-14 md:py-16">
        <div className="shell">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Keep exploring</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-[-.04em]">You might also like</h2><p className="mt-2 text-xs text-white/35">Related by genre or country in this sample catalogue.</p></div><Link href="/#discover" className="shrink-0 text-xs text-[#d9b779] transition hover:text-[#edce94]">View catalogue</Link></div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {related.map((item) => <Link key={item.id} href={`/title/${item.id}`} className="group min-w-0">
              <div className="poster"><img src={item.image} alt={`${item.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold text-white">{item.title}</span></div>
              <p className="mt-3 text-xs text-white/45">{item.year} · {item.genre}</p>
              <p className="mt-1 text-[11px] text-white/30">{item.country}</p>
            </Link>)}
          </div>
        </div>
      </section>}
      <footer className="border-t border-white/[.08] py-8"><div className="shell flex flex-col justify-between gap-3 text-xs text-white/30 sm:flex-row"><Link href="/" className="font-['Manrope'] font-extrabold text-white/65">watchora<span className="text-[#d9b779]">.</span></Link><span>Streaming platform preview · licensed playback provider not yet connected</span></div></footer>
    </main>
  );
}
