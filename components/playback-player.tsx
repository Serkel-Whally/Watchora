"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Hls from "hls.js";
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
  const [playbackError, setPlaybackError] = useState("");
  const available = playback.status === "available";
  const manifestUrl = playback.status === "available" ? playback.session.manifestUrl : null;

  const saveProgress = useCallback((video: HTMLVideoElement, force = false) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) return;
    const now = Date.now();
    if (!force && now - lastSavedAt.current < 10000) return;
    lastSavedAt.current = now;
    const completed = video.ended || video.duration - video.currentTime < 20;
    const position = completed ? 0 : Math.floor(video.currentTime);
    const duration = Math.floor(video.duration);
    const records = readProgress().filter((record) => record.titleId !== title.id);
    if (position > 0) records.unshift({ titleId: title.id, position, duration, updatedAt: now });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50))); } catch { /* Keep playback usable when storage is full. */ }

    // Signed-in members sync progress across devices. Guests retain local progress.
    void fetch("/api/viewing-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId: title.id, position, duration, completed }),
      keepalive: force,
    }).catch(() => { /* Local progress remains available when offline or signed out. */ });
  }, [title.id]);

  useEffect(() => {
    const record = readProgress().find((item) => item.titleId === title.id);
    if (record && record.position > 10 && record.position < record.duration - 20) setResumePosition(record.position);
    setResumeReady(true);

    let active = true;
    void fetch(`/api/viewing-progress?titleId=${title.id}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        const progress = result?.progress;
        if (!active || !progress || progress.completed) return;
        const position = Number(progress.position_seconds);
        const duration = Number(progress.duration_seconds);
        if (Number.isFinite(position) && Number.isFinite(duration) && position > 10 && position < duration - 20) {
          setResumePosition(position);
          const records = readProgress().filter((item) => item.titleId !== title.id);
          records.unshift({ titleId: title.id, position, duration, updatedAt: Date.parse(progress.updated_at) || Date.now() });
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50))); } catch { /* no-op */ }
        }
      })
      .catch(() => { /* Account sync is optional; local progress remains usable. */ });
    return () => { active = false; };
  }, [title.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifestUrl) return;
    setPlaybackError("");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = manifestUrl;
      return () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setPlaybackError("This browser cannot play HLS video. Try an up-to-date version of Safari, Chrome, Firefox or Edge.");
      return;
    }

    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(manifestUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) setPlaybackError("The video stream could not be loaded. Refresh the page and try again.");
    });
    return () => hls.destroy();
  }, [manifestUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !available || !resumeReady) return;
    const restore = () => {
      if (resumePosition > 0 && Math.abs(video.currentTime - resumePosition) > 5) video.currentTime = resumePosition;
    };
    if (video.readyState >= 1) restore();
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
    if (video) {
      video.currentTime = 0;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        void fetch("/api/viewing-progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: title.id, position: 0, duration: Math.floor(video.duration), completed: false }),
        }).catch(() => undefined);
      }
    }
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
              <video ref={videoRef} className="aspect-video w-full bg-black" controls playsInline preload="metadata" poster={title.image || undefined} onTimeUpdate={(event) => saveProgress(event.currentTarget)} onPause={(event) => saveProgress(event.currentTarget, true)} onEnded={(event) => saveProgress(event.currentTarget, true)}>
                {playback.status === "available" && playback.session.subtitles.map((subtitle) => <track key={subtitle.language} kind="subtitles" src={subtitle.url} srcLang={subtitle.language} label={subtitle.label} default={subtitle.isDefault}/>)}
                Your browser does not support this video format.
              </video>
              {playbackError && <p role="alert" className="absolute left-4 right-4 top-4 rounded-xl border border-rose-400/20 bg-black/85 px-4 py-3 text-xs text-rose-200">{playbackError}</p>}
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
                <p className="mt-3 text-sm leading-6 text-white/50">{playback.status === "unavailable" && playback.reason === "not_configured" ? "Secure playback is not configured yet. An administrator must finish the provider connection." : playback.status === "unavailable" && playback.reason === "not_entitled" ? "Sign in with a Watchora account to request a playback session." : playback.status === "unavailable" && playback.reason === "not_in_territory" ? "This title is not licensed for streaming in your current territory." : "This title does not have an active, rights-cleared video asset available yet."}</p>
                <Link href={`/title/${title.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]"><Play size={14}/> Return to title</Link>
              </div>
            </div>
          )}
        </div>
        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><p className="eyebrow">{title.kind} · {title.year > 0 ? title.year : "Year TBA"} · {title.country}</p><h1 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-tight">{title.title}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">{title.description}</p></div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-[11px] text-white/45"><ShieldCheck size={15} className="text-[#d9b779]"/> Rights-cleared playback only</div>
        </div>
      </div>
    </main>
  );
}
