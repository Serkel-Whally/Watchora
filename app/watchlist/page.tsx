"use client";

import { useMemo } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { ArrowLeft, Bookmark, Cloud, CloudOff } from "lucide-react";
import { films } from "@/lib/catalogue";
import { useWatchlist } from "@/lib/use-watchlist";

export default function WatchlistPage() {
  const { saved, ready, synced, syncAvailable, remove } = useWatchlist();
  const items = useMemo(() => films.filter((film) => saved.includes(film.id)), [saved]);

  return <main className="min-h-screen">
    <SiteHeader />
    <section className="shell py-12 md:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
      <p className="eyebrow mt-9">Your personal collection</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Your watchlist.</h1><p className="mt-3 text-sm text-white/45">Keep the stories you want to come back to.</p></div>
        {ready && <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] text-white/45">{synced ? <Cloud size={13} className="text-[#d9b779]"/> : <CloudOff size={13}/>} {synced ? "Synced to your account" : "Saved on this device"}</span>}
      </div>
      {!ready ? <p className="py-20 text-sm text-white/40">Loading your watchlist…</p> : items.length ? <>
        <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">{items.map((film) => <article key={film.id}>
          <Link href={`/title/${film.id}`} className="poster group block"><img src={film.image} alt={`${film.title} poster`} loading="lazy" onError={(event) => { event.currentTarget.style.opacity = "0"; }}/><span className="absolute bottom-3 left-3 right-3 z-10 text-sm font-semibold">{film.title}</span></Link>
          <div className="mt-3 flex items-center justify-between gap-2"><div><p className="text-xs text-white/65">{film.year} · {film.genre}</p><p className="mt-1 text-[11px] text-white/35">{film.country}</p></div><button onClick={() => remove(film.id)} className="rounded-full border border-white/10 p-2 text-white/50 hover:border-[#d9b779] hover:text-[#d9b779]" aria-label={`Remove ${film.title} from watchlist`}><Bookmark size={14} fill="currentColor"/></button></div>
        </article>)}</div>
        <p className="mt-8 text-[11px] text-white/30">{synced ? "Your saved titles are available wherever you sign in." : syncAvailable ? "Sign in to sync this list across your devices. Your current saves will be merged automatically." : "Your saves are stored on this device. Account sync will be available when Watchora accounts are configured."} {syncAvailable && !synced && <Link href="/sign-in?next=%2Fwatchlist" className="ml-1 text-[#d9b779] hover:text-[#edce94]">Sign in</Link>}</p>
      </> : <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.025] px-6 py-16 text-center"><Bookmark size={25} className="mx-auto text-[#d9b779]"/><h2 className="mt-5 font-['Manrope'] text-xl font-semibold">Your list is waiting for a story.</h2><p className="mt-2 text-sm text-white/40">Save films and series while exploring to keep them close.</p><Link href="/#discover" className="mt-6 inline-flex rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Explore titles</Link></div>}
    </section>
  </main>;
}
