import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { ArrowRight, Compass } from "lucide-react";
import { curatedCollections, getCollectionTitles } from "@/lib/curated-collections";

const tones = {
  warm: "from-[#594536] via-[#28211d] to-[#111216]",
  cool: "from-[#31515a] via-[#1b2a30] to-[#111216]",
  rose: "from-[#603b48] via-[#2d2028] to-[#111216]",
  gold: "from-[#62502f] via-[#30291d] to-[#111216]",
};

export default function CollectionsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="shell py-14 md:py-20">
        <Link href="/" className="text-xs text-white/40 hover:text-white">← Back home</Link>
        <p className="eyebrow mt-10">A point of view, not an algorithm</p>
        <h1 className="mt-3 max-w-3xl font-['Manrope'] text-4xl font-semibold tracking-[-.065em] md:text-6xl">Stories, brought together.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">Explore hand-curated starting points for your next film or series. Each collection is editorially configured and updated as the catalogue grows.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {curatedCollections.map((collection) => {
            const titles = getCollectionTitles(collection);
            return <Link key={collection.slug} href={`/collections/${collection.slug}`} className={`group relative flex min-h-[270px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tones[collection.tone]} p-7 transition hover:-translate-y-1 hover:border-[#d9b779]/40 md:p-9`}>
              <div className="flex items-center justify-between"><span className="eyebrow">{collection.number} / Curated collection</span><Compass size={17} className="text-white/45"/></div>
              <div><h2 className="max-w-sm font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">{collection.title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/55">{collection.description}</p><div className="mt-6 flex items-center justify-between"><span className="text-[11px] text-white/40">{titles.length} {titles.length === 1 ? "sample title" : "sample titles"}</span><span className="inline-flex items-center gap-2 text-xs font-semibold text-[#e4c58e]">Explore collection <ArrowRight size={14} className="transition group-hover:translate-x-1"/></span></div></div>
            </Link>;
          })}
        </div>
        <p className="mt-10 text-center text-[11px] text-white/25">Editorial sample collections · Catalogue titles are illustrative, not a live worldwide database.</p>
      </section>
    </main>
  );
}
