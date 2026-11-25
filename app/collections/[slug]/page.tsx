import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCollectionTitles, getCuratedCollection } from "@/lib/curated-collections";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: "quietly-extraordinary" }, { slug: "worlds-of-wonder" }, { slug: "edge-of-your-seat" }, { slug: "stories-that-make-you-smile" }];
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCuratedCollection(slug);
  if (!collection) notFound();
  const titles = getCollectionTitles(collection);

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="shell py-14 md:py-20">
        <Link href="/collections" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> All collections</Link>
        <p className="eyebrow mt-10">{collection.number} / Curated collection</p>
        <h1 className="mt-3 max-w-3xl font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">{collection.title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">{collection.description}</p>
        <p className="mt-4 max-w-xl border-l border-[#d9b779]/50 pl-4 text-sm leading-6 text-white/40">{collection.editorialNote}</p>
        <div className="mt-12 flex items-center justify-between border-b border-white/10 pb-4"><p className="eyebrow">In this collection</p><span className="text-[11px] text-white/35">{titles.length} sample {titles.length === 1 ? "title" : "titles"}</span></div>
        {titles.length ? <div className="hide-scrollbar -mx-[18px] mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[18px] pb-5 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-9">{titles.map((film) => <article key={film.id} className="w-[min(48vw,220px)] shrink-0 snap-start sm:w-[220px] lg:w-auto"><Link href={`/title/${film.id}`} className="group block"><div className="poster"><img src={film.image} alt={`${film.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">{film.title}</span></div><div className="mt-3 flex justify-between gap-2 text-xs text-white/45"><span>{film.year} · {film.genre}</span><span>{film.kind}</span></div><p className="mt-1 text-[11px] text-white/30">{film.country}</p></Link></article>)}</div> : <div className="py-20 text-center"><p className="text-sm text-white/45">This collection is being refreshed.</p><Link href="/explore" className="mt-4 inline-flex items-center gap-2 text-xs text-[#d9b779]">Explore the catalogue <ArrowRight size={14}/></Link></div>}
        <div className="mt-14 flex flex-wrap gap-3"><Link href="/collections" className="rounded-full border border-white/15 px-5 py-3 text-xs text-white/70 hover:border-white/35">More collections</Link><Link href="/explore" className="rounded-full bg-[#d9b779] px-5 py-3 text-xs font-semibold text-[#17130d] hover:bg-[#edce94]">Explore all titles</Link></div>
        <p className="mt-12 text-center text-[11px] text-white/25">Illustrative sample catalogue. Watchora does not host or stream video.</p>
      </section>
    </main>
  );
}
