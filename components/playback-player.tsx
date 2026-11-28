"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import type { Film } from "@/lib/catalogue";
import type { PlaybackAvailability } from "@/lib/playback";

type ProgressRecord = { titleId: number; position: number; duration: number; updatedAt: number };

const STORAGE_KEY = "watchora-viewing-progress";

function readProgress(): ProgressRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item): item is ProgressRecord =>
      item && Number.isSafeInteger(item.titleId) && Number.isFinite(item.position) &&
      Number.isFinite(item.duration) && Number.isFinite(item.updatedAt)
    ) : [];
  } catch { return []; }
}

export default function PlaybackPlayer({ title, playback }: { title: Film; playback: PlaybackAvailability }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAt = useRef(0);
  const [resumePosition, setResumePosition] = useState(0);
  const [resumeReady, setResumeReady] = useState(false);
  const available = playback.status === "available";

  const saveProgress = useCallback((video: HTMLVideoElement, force = false) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) return;
    const now = Date.now();
    if (!force && now - lastSavedAt.current < 10000) return;
    lastSavedAt.current = now;
    const records = readProgress().filter((record) => record.titleId !== title.id);
    const position = video.ended || video.duration - video.currentTime < 20 ? 0 : video.currentTime;
    if (position > 0) records.unshift({ titleId: title.id, position, duration: video.duration, updatedAt: now });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50))); } catch { /* Keep playback usable when storage is full. */ }
  }, [title.id]);

  useEffect(() => {
    const record = readProgress().find((item) => item.titleId === title.id);
    if (record && record.position > 10 && record.position < record.duration - 20) setResumePosition(record.position);
    setResumeReady(true);
  }, [title.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !available || !resumeReady) return;
    const restore = () => {
      if (resumePosition > 0 && Math.abs(video.currentTime - resumePosition) > 5) video.currentTime = resumePosition;
    };
    video.addEventListener("loadedmetadata", restore);
    return () => video.removeEventListener("loadedmetadata", restore);
  }, [available, resumePosition, resumeReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !available) return;
    const persist = () => saveProgress(video, true);
    window.addEventListener("pagehide", persist);
    return () => { window.removeEventListener("pagehide", persist); persist(); };
  }, [available, saveProgress]);

  const clearResume = () => {
    const video = videoRef.current;
    if (video) video.currentTime = 0;
    setResumePosition(0);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readProgress().filter((item) => item.titleId !== title.id))); } catch { /* no-op */ }
  };

  return (
    <main className="min-h-screen bg-[#07080a]">
      <div className="border-b border-white/[.07] bg-[#090a0d]">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link>
          <Link href={`/title/${title.id}`} className="inline-flex items-center gap-2 text-xs text-white/50 transition hover:text-white"><ArrowLeft size={14}/> Back to title</Link>
        </div>
      </div>
      <div className="shell pb-16 pt-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,.45)]">
          {available ? (
            <div className="relative">
              <video ref={videoRef} className="aspect-video w-full bg-black" controls playsInline preload="metadata" poster={title.image} onTimeUpdate={(event) => saveProgress(event.currentTarget)} onPause={(event) => saveProgress(event.currentTarget, true)} onEnded={(event) => saveProgress(event.currentTarget, true)}>
                {playback.session.subtitles.map((subtitle) => <track key={subtitle.language} kind="subtitles" src={subtitle.url} srcLang={subtitle.language} label={subtitle.label} default={subtitle.isDefault}/>)}
                Your browser does not support this video format.
              </video>
              {resumePosition > 0 && <div className="absolute bottom-16 left-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/85 px-3 py-2 text-[11px] text-white shadow-xl"><span>Resume from {Math.floor(resumePosition / 60)}:{String(Math.floor(resumePosition % 60)).padStart(2, "0")}</span><button onClick={clearResume} className="text-white/45 underline underline-offset-2 hover:text-white">Start over</button></div>}
            </div>
          ) : (
            <div className="relative flex aspect-video min-h-[260px] items-center justify-center overflow-hidden bg-[#111319] px-6 text-center">
              <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm" style={{ backgroundImage: `url("${title.image}")` }}/>
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#090a0d]/85 to-black/95"/>
              <div className="relative z-10 max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d9b779]/35 bg-[#d9b779]/10 text-[#d9b779]"><LockKeyhole size={24}/></div>
                <p className="eyebrow mt-5">Playback not connected</p>
                <h1 className="mt-3 font-['Manrope'] text-2xl font-semibold tracking-tight text-white sm:text-3xl">This title isn’t ready to stream yet.</h1>
                <p className="mt-3 text-sm leading-6 text-white/50">{playback.status === "unavailable" && playback.reason === "not_configured" ? "Watchora’s licensed video provider has not been connected. This sample title has no authorised video source attached." : "This title is not currently available for playback on your account or in your territory."}</p>
                <Link href={`/title/${title.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]"><Play size={14}/> Return to title</Link>
              </div>
            </div>
          )}
        </div>
        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><p className="eyebrow">{title.kind} · {title.year} · {title.country}</p><h1 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-tight">{title.title}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">{title.description}</p></div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-[11px] text-white/45"><ShieldCheck size={15} className="text-[#d9b779]"/> Rights-cleared playback only</div>
        </div>
      </div>
    </main>
  );
}
