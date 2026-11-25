"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { ArrowLeft, ExternalLink, Star, UserRound } from "lucide-react";
import { films } from "@/lib/catalogue";

type Profile = { id: string; display_name: string; bio: string; created_at: string };
type Review = { id: string; title_id: number; rating: number; body: string; status: "pending" | "approved" | "rejected"; created_at: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/profile", { cache: "no-store" }), fetch("/api/reviews/history", { cache: "no-store" })])
      .then(async ([profileResponse, historyResponse]) => {
        const profileData = await profileResponse.json();
        const historyData = await historyResponse.json();
        if (!active) return;
        if (!profileResponse.ok) throw new Error(profileData.error || "Sign in to manage your profile.");
        if (!historyResponse.ok) throw new Error(historyData.error || "Unable to load your reviews.");
        setProfile(profileData.profile);
        setName(profileData.profile.display_name);
        setBio(profileData.profile.bio || "");
        setReviews(historyData.reviews || []);
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load your account."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name, bio }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save profile.");
      setProfile(data.profile); setName(data.profile.display_name); setBio(data.profile.bio); setNotice("Your profile has been saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save profile."); }
    finally { setSaving(false); }
  }

  return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-4xl py-12 md:py-16">
    <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back home</Link>
    <p className="eyebrow mt-9">Your Watchora account</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Your profile.</h1>
    <p className="mt-3 text-sm text-white/45">Shape how other film lovers see you, and keep track of every review you’ve submitted.</p>
    {loading ? <p className="py-16 text-sm text-white/40">Loading your account…</p> : error && !profile ? <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-7"><p role="alert" className="text-sm text-white/65">{error}</p><Link href={`/sign-in?next=${encodeURIComponent("/profile")}`} className="mt-5 inline-flex rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Sign in to continue</Link></div> : profile && <>
      <form onSubmit={save} className="mt-9 rounded-3xl border border-white/10 bg-[#101216] p-6 sm:p-8">
        <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[#d9b779]/10 text-[#d9b779]"><UserRound size={20}/></div><div><h2 className="font-semibold">Public profile</h2><p className="text-xs text-white/35">Visible alongside your approved reviews.</p></div></div>
        <label htmlFor="member-name" className="mt-7 block text-xs font-medium text-white/65">Display name</label><input id="member-name" value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={40} required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#d9b779]/60"/>
        <div className="mt-6 flex items-center justify-between"><label htmlFor="member-bio" className="text-xs font-medium text-white/65">A little about you</label><span className="text-[10px] text-white/30">{bio.length}/240</span></div><textarea id="member-bio" value={bio} onChange={event=>setBio(event.target.value)} maxLength={240} rows={4} placeholder="What kinds of stories stay with you?" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#d9b779]/60"/>
        {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}{notice && <p role="status" className="mt-3 text-xs text-[#d9b779]">{notice}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4"><button disabled={saving} className="rounded-full bg-[#d9b779] px-6 py-3 text-xs font-bold text-[#17130d] disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button><Link href={`/members/${profile.id}`} className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white">View public profile <ExternalLink size={13}/></Link></div>
        <p className="mt-5 text-[11px] leading-5 text-white/30">Your email address and sign-in details are never shown on your public profile.</p>
      </form>
      <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your contribution</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold">Review history</h2></div><span className="text-xs text-white/35">{reviews.length} submitted</span></div>
        {reviews.length ? <div className="mt-6 space-y-3">{reviews.map(review=>{const title=films.find(item=>item.id===review.title_id);return <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white/80">{title?.title || "Catalogue title"}</p><p className="mt-1 text-[11px] text-white/35">{new Date(review.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1 text-xs text-[#d9b779]"><Star size={12} fill="currentColor"/>{review.rating}/5</span><span className={`rounded-full px-2.5 py-1 text-[10px] capitalize ${review.status==="approved"?"bg-emerald-400/10 text-emerald-300":review.status==="rejected"?"bg-red-400/10 text-red-300":"bg-amber-300/10 text-amber-200"}`}>{review.status}</span></div></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-white/50">{review.body}</p>{title && <Link href={`/title/${title.id}#reviews`} className="mt-3 inline-flex text-xs text-[#d9b779] hover:text-[#edce94]">Open title <ExternalLink size={12} className="ml-1"/></Link>}</article>})}</div> : <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center"><p className="text-sm text-white/50">You haven’t submitted a review yet.</p><Link href="/explore" className="mt-4 inline-flex text-xs text-[#d9b779]">Find a story to review</Link></div>}
      </section>
    </>}
  </section></main>;
}
