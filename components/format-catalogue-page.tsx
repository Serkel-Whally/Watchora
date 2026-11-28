import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import type { TitleKind } from "@/lib/catalogue";

export default function FormatCataloguePage({ kind }: { kind: TitleKind }) {
  const titles = getCatalogueProvider().getAll().filter((title) => title.kind === kind);
  const label = kind === "Film" ? "Movies" : "Series";
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="shell pb-16 pt-12 md:pt-16">
        <p className="eyebrow">Watchora catalogue</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">{label}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Explore stories from around the world. Titles are illustrative catalogue entries until licensed metadata and playback are connected.</p></div>
          <Link href="/" className="text-xs font-semibold text-[#d9b779] hover:text-[#edce94]">Back to home</Link>
        </div>
        {titles.length ? <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {titles.map((title) => <Link key={title.id} href={`/title/${title.id}`} className="group min-w-0">
            <div className="poster ring-1 ring-white/[.06] transition group-hover:-translate-y-1 group-hover:ring-[#d9b779]/50"><img src={title.image} alt={`${title.title} poster`} loading="lazy"/><span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold text-white">{title.title}</span></div>
            <p className="mt-3 text-xs text-white/55">{title.year} · {title.genre}</p><p className="mt-1 text-[11px] text-white/30">{title.country}</p>
          </Link>)}
        </div> : <p className="mt-10 rounded-2xl border border-white/10 p-8 text-sm text-white/45">No {label.toLowerCase()} are available in this catalogue yet.</p>}
      </section>
    </main>
  );
}
