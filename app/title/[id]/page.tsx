import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Globe2, Languages, Star } from "lucide-react";
import WatchlistToggle from "@/components/watchlist-toggle";
import TitleViewTracker from "@/components/title-view-tracker";
import TitleReviews from "@/components/title-reviews";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

const catalogue = getCatalogueProvider();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = catalogue.getById(Number(id));
  return {
    title: film ? `${film.title} — Watchora` : "Title not found — Watchora",
    description: film?.description,
  };
}

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = catalogue.getById(Number(id));
  if (!film) notFound();

  const related = catalogue.getAll()
    .filter((item) => item.id !== film.id && (item.genre === film.genre || item.country === film.country))
    .slice(0, 3);

  return (
    <main className="min-h-screen">
      <TitleViewTracker id={film.id} />
      <SiteHeader />

      <section className="shell py-10 md:py-14">
        <Link href="/explore" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back to explore</Link>
        <div className="mt-9 grid gap-9 md:grid-cols-[minmax(230px,330px)_1fr] md:gap-14">
          <div className="poster mx-auto w-full max-w-[330px] shadow-2xl">
            <img src={film.image} alt={`${film.title} poster`} />
            <span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wider">{film.kind.toUpperCase()}</span>
          </div>
          <div className="py-2 md:py-8">
            <p className="eyebrow">Watchora title guide</p>
            <h1 className="mt-4 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">{film.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45">
              <span>{film.year}</span><span>{film.genre}</span><span>{film.kind}</span>
              {film.runtimeMinutes && <span className="inline-flex items-center gap-1"><Clock3 size={12}/> {film.runtimeMinutes} min</span>}
              {film.seasonCount && <span>{film.seasonCount} seasons</span>}
              <span className="inline-flex items-center gap-1"><Star size={12} className="text-[#d9b779]"/> {film.rating} <span className="text-white/25">sample rating</span></span>
            </div>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/65">{film.description}</p>
            {(film.originalTitle || film.originalLanguage) && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/40">{film.originalTitle && <span>Original title: {film.originalTitle}</span>}{film.originalLanguage && <span className="inline-flex items-center gap-1"><Languages size={12}/> Original language: {film.originalLanguage.toUpperCase()}</span>}</div>}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs text-white/55"><Globe2 size={13}/> {film.country}</span>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-3"><WatchlistToggle id={film.id} title={film.title}/><Link href="#reviews" className="rounded-full border border-white/10 px-4 py-2.5 text-xs font-medium text-white/65 transition hover:border-white/25 hover:text-white">Read & write reviews</Link></div>
            <div className="mt-10 rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.05] p-5">
              <p className="text-sm font-semibold text-white/85">Where to watch</p>
              <p className="mt-2 text-xs leading-6 text-white/45">Watchora helps you discover stories; it does not host or stream films. Viewing options are not connected in this preview. We’ll only list providers when a reliable, licensed availability source is integrated.</p>
            </div>
          </div>
        </div>
      </section>

      <TitleReviews titleId={film.id} title={film.title} />

      {related.length > 0 && <section className="border-t border-white/[.08] bg-[#0d0f13] py-14 md:py-16">
        <div className="shell">
          <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Keep exploring</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-[-.04em]">You might also like</h2></div><Link href="/explore" className="text-xs text-[#d9b779] hover:text-[#edce94]">View all</Link></div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
            {related.map((item) => <Link key={item.id} href={`/title/${item.id}`} className="group min-w-0">
              <div className="poster"><img src={item.image} alt={`${item.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">{item.title}</span></div>
              <p className="mt-3 text-xs text-white/45">{item.year} · {item.genre} · {item.country}</p>
            </Link>)}
          </div>
        </div>
      </section>}
      <footer className="border-t border-white/[.08] py-8"><div className="shell flex flex-col justify-between gap-3 text-xs text-white/30 sm:flex-row"><Link href="/" className="font-['Manrope'] font-extrabold text-white/65">watchora<span className="text-[#d9b779]">.</span></Link><span>Discovery preview · No streaming hosted</span></div></footer>
    </main>
  );
}
