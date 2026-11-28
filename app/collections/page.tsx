import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { curatedCollections, getCollectionTitles } from "@/lib/curated-collections";

const tones = {
  warm: "from-[#594536]/95 via-[#28211d]/80 to-[#111216]",
  cool: "from-[#31515a]/95 via-[#1b2a30]/80 to-[#111216]",
  rose: "from-[#603b48]/95 via-[#2d2028]/80 to-[#111216]",
  gold: "from-[#62502f]/95 via-[#30291d]/80 to-[#111216]",
};

export default function CollectionsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="shell py-12 md:py-16">
        <Link href="/" className="text-xs text-white/40 transition hover:text-white">← Back home</Link>
        <div className="mt-10 max-w-3xl">
          <p className="eyebrow inline-flex items-center gap-2"><Sparkles size={12}/> Watchora editorial</p>
          <h1 className="mt-4 font-['Manrope'] text-4xl font-semibold tracking-[-.065em] md:text-6xl">Stories, brought together.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50 md:text-base">Thoughtful starting points for your next film or series. Explore by mood, curiosity or the kind of story you want to spend time with.</p>
        </div>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5">
          {curatedCollections.map((collection) => {
            const titles = getCollectionTitles(collection);
            const lead = titles[0];
            return (
              <Link key={collection.slug} href={`/collections/${collection.slug}`} className={`group relative isolate flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${tones[collection.tone]} p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d9b779]/40 hover:shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-8 md:min-h-[360px]`}>
                {lead && <img src={lead.image} alt="" aria-hidden="true" loading="lazy" className="absolute -right-5 -top-5 -z-20 h-[115%] w-[58%] object-cover object-center opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-45"/>}
                <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${tones[collection.tone]} via-[#111216]/75 to-[#111216]/20`}/>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e5c58d]">{collection.number} / Curated collection</span>
                  <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/15 text-white/65 transition group-hover:border-[#d9b779]/50 group-hover:text-[#edce94]"><Compass size={16}/></span>
                </div>
                <div className="max-w-[440px]">
                  <h2 className="font-['Manrope'] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{collection.title}</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/65">{collection.description}</p>
                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
                    <span className="text-[11px] text-white/45">{titles.length} {titles.length === 1 ? "sample title" : "sample titles"}</span>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#e4c58e]">Explore collection <ArrowRight size={14} className="transition group-hover:translate-x-1"/></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-9 text-center text-[11px] leading-5 text-white/30">Editorial sample collections. Catalogue titles are illustrative, not a live worldwide database.</p>
      </section>
    </main>
  );
}
