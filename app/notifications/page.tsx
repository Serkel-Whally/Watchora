"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { Bell, CheckCheck, Clock3, MessageCircle, Star, ThumbsUp } from "lucide-react";
import { films } from "@/lib/catalogue";

type Notification = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  notification_type: "review_approved" | "review_rejected" | "review_helpful";
  title_id: number;
  review_id: string | null;
  created_at: string;
  read_at: string | null;
};

function notificationCopy(item: Notification) {
  if (item.notification_type === "review_approved") return { title: "Your review is published", body: "Your review has been approved and is now visible to the Watchora community.", icon: Star };
  if (item.notification_type === "review_rejected") return { title: "A review needs attention", body: "Your review was not approved for publication. You can review the community guidelines before submitting another.", icon: MessageCircle };
  return { title: "Your review was found helpful", body: `${item.actor_name || "A Watchora member"} found your review helpful.`, icon: ThumbsUp };
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { setSignedIn(false); return; }
      if (response.status === 503) { setConfigured(false); return; }
      if (!response.ok) throw new Error(data.error || "Unable to load notifications.");
      setItems(data.notifications || []);
      setSignedIn(true);
      setConfigured(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  async function markRead(ids: string[]) {
    if (!ids.length) return;
    setUpdating(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Unable to update notifications.");
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ids.includes(item.id) ? { ...item, read_at: now } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update notifications.");
    } finally { setUpdating(false); }
  }

  async function markAllRead() {
    if (!unreadCount) return;
    setUpdating(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) throw new Error("Unable to update notifications.");
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update notifications.");
    } finally { setUpdating(false); }
  }

  return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-4xl py-12 md:py-16">
    <Link href="/profile" className="text-xs text-white/40 transition hover:text-white">← Your account</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">Your Watchora account</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Notifications.</h1><p className="mt-3 text-sm text-white/45">Review updates and appreciation from the community.</p></div>
      {signedIn && configured && unreadCount > 0 && <button onClick={() => void markAllRead()} disabled={updating} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/65 transition hover:border-[#d9b779]/50 hover:text-[#d9b779] disabled:opacity-50"><CheckCheck size={14}/> Mark all read</button>}
    </div>
    {error && <p role="alert" className="mt-6 text-sm text-red-300">{error}</p>}
    {loading ? <p className="py-20 text-sm text-white/40">Loading notifications…</p>
    : !configured ? <div className="mt-9 rounded-2xl border border-white/10 p-8 text-sm leading-6 text-white/50">Notifications will be available after the Watchora community service is configured.</div>
    : !signedIn ? <div className="mt-9 rounded-2xl border border-white/10 bg-white/[.025] p-8"><Bell size={22} className="text-[#d9b779]"/><p className="mt-4 text-sm text-white/60">Sign in to see review decisions and helpful votes.</p><Link href="/sign-in?next=%2Fnotifications" className="mt-5 inline-flex rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Sign in</Link></div>
    : items.length ? <div className="mt-9 space-y-3">{items.map((item) => {
      const copy = notificationCopy(item);
      const Icon = copy.icon;
      const title = films.find((film) => film.id === item.title_id);
      return <article key={item.id} className={`rounded-2xl border p-5 transition ${item.read_at ? "border-white/[.07] bg-white/[.02]" : "border-[#d9b779]/25 bg-[#d9b779]/[.045]"}`}>
        <div className="flex gap-4">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d9b779]/10 text-[#d9b779]"><Icon size={17}/></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-sm font-semibold text-white/85">{copy.title}</h2>{!item.read_at && <span className="mt-1 size-2 rounded-full bg-[#d9b779]" aria-label="Unread"/>}</div>
            <p className="mt-1 text-sm leading-6 text-white/50">{copy.body}</p>
            {title && <Link href={`/title/${title.id}#reviews`} onClick={() => { if (!item.read_at) void markRead([item.id]); }} className="mt-3 inline-flex text-xs font-medium text-[#d9b779] hover:text-[#edce94]">{title.title} · {title.year}</Link>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-white/30"><Clock3 size={11}/>{dateLabel(item.created_at)}</span>{!item.read_at && <button onClick={() => void markRead([item.id])} disabled={updating} className="text-[11px] text-white/45 hover:text-white disabled:opacity-50">Mark as read</button>}</div>
          </div>
        </div>
      </article>;
    })}</div>
    : <div className="mt-9 rounded-2xl border border-white/10 px-6 py-16 text-center"><Bell size={25} className="mx-auto text-[#d9b779]"/><h2 className="mt-5 font-['Manrope'] text-xl font-semibold">You’re all caught up.</h2><p className="mt-2 text-sm text-white/40">We’ll let you know when a review is approved or someone finds it helpful.</p><Link href="/#discover" className="mt-5 inline-flex text-xs text-[#d9b779]">Explore Watchora</Link></div>}
  </section></main>;
}
