import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { createPlaybackSession } from "@/lib/playback";

const catalogue = getCatalogueProvider();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = catalogue.getById(Number(id));
  return { title: title ? `Watch ${title.title} — Watchora` : "Watch — Watchora" };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const title = catalogue.getById(Number(id));
  if (!title) notFound();

  const playback = await createPlaybackSession(title.id);
  const playable = playback.status === "available";

  return (
    <main className="min-h-screen bg-[#07080a]">
      <SiteHeader />
      <div className="shell pb-16 pt-7">
        <Link href={`/title/${title.id}`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to title</Link>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,.45)]">
          {playable ? (
            <video className="aspect-video w-full bg-black" controls playsInline preload="metadata" src={playback.session.manifestUrl}>
              Your browser does not support this video format.
            </video>
          ) : (
            <div className="relative flex aspect-video min-h-[260px] items-center justify-center overflow-hidden bg-[#111319] px-6 text-center">
              <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm" style={{ backgroundImage: `url("${title.image}")` }}/>
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#090a0d]/85 to-black/95"/>
              <div className="relative z-10 max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d9b779]/35 bg-[#d9b779]/10 text-[#d9b779]"><LockKeyhole size={24}/></div>
                <p className="eyebrow mt-5">Playback not connected</p>
                <h1 className="mt-3 font-['Manrope'] text-2xl font-semibold tracking-tight text-white sm:text-3xl">This title isn’t ready to stream yet.</h1>
                <p className="mt-3 text-sm leading-6 text-white/50">Watchora is preparing its licensed streaming catalogue. This sample title has no authorised video source attached.</p>
                <Link href={`/title/${title.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]"><Play size={14}/> Return to title</Link>
              </div>
            </div>
          )}
        </div>
        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><p className="eyebrow">{title.kind} · {title.year} · {title.country}</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-tight">{title.title}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">{title.description}</p></div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-[11px] text-white/45"><ShieldCheck size={15} className="text-[#d9b779]"/> Rights-cleared playback only</div>
        </div>
      </div>
    </main>
  );
}
