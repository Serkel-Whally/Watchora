import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, Globe2, Star } from "lucide-react";
import { films } from "@/lib/catalogue";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = films.find(item => item.id === Number(id));
  return { title: film ? `${film.title} — Watchora` : "Title not found — Watchora", description: film?.description };
}

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const film = films.find(item => item.id === Number(id));
  if (!film) notFound();
  return <main className="min-h-screen">
    <header className="border-b border-white/[.08]"><div className="shell flex h-[76px] items-center justify-between"><Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link><Link href="/watchlist" className="text-xs text-white/55 hover:text-white">Watchlist</Link></div></header>
    <section className="shell py-10 md:py-14"><Link href="/explore" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back to explore</Link>
      <div className="mt-9 grid gap-9 md:grid-cols-[minmax(230px,330px)_1fr] md:gap-14">
        <div className="poster mx-auto w-full max-w-[330px]"><img src={film.image} alt={`${film.title} poster`}/><span className="absolute left-3 top-3 z-10 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wider">{film.kind.toUpperCase()}</span></div>
        <div className="py-2 md:py-8"><p className="eyebrow">Watchora title guide</p><h1 className="mt-4 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">{film.title}</h1><div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45"><span>{film.year}</span><span>{film.genre}</span><span>{film.kind}</span><span className="inline-flex items-center gap-1"><Star size={12} className="text-[#d9b779]"/> {film.rating} <span className="text-white/25">sample rating</span></span></div>
          <p className="mt-8 max-w-2xl text-base leading-8 text-white/65">{film.description}</p>
          <div className="mt-8 flex items-center gap-2 text-xs text-white/45"><Globe2 size={14}/> Country: {film.country}</div>
          <div className="mt-10 rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.05] p-5"><p className="text-sm font-semibold text-white/85">Where to watch</p><p className="mt-2 text-xs leading-6 text-white/45">Watchora is a discovery guide, not a streaming service. Verified provider links are not available in this sample build. We will only show viewing options when a licensed availability source is connected.</p></div>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/explore" className="rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Explore more</Link><Link href="/watchlist" className="rounded-full border border-white/15 px-5 py-3 text-xs text-white/70 hover:border-white/40">Open watchlist</Link></div>
        </div>
      </div>
    </section>
  </main>;
}
