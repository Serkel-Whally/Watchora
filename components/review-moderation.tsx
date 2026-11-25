"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Clock3, ShieldCheck, X } from "lucide-react";
import { films } from "@/lib/catalogue";
import ReviewReportsPanel from "@/components/review-reports-panel";
import ReviewCommentModeration from "@/components/review-comment-moderation";

type Review = {
  id: string;
  title_id: number;
  user_id: string;
  rating: number;
  body: string;
  contains_spoilers: boolean;
  status: string;
  created_at: string;
  profiles?: { display_name?: string } | { display_name?: string }[] | null;
};

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/sign-in?next=%2Fadmin%2Freviews";
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to load reviews.");
      setReviews(Array.isArray(result.reviews) ? result.reviews : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function moderate(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to moderate this review.");
      setReviews((current) => current.filter((review) => review.id !== id));
      setNotice(status === "approved" ? "Review approved and now visible on its title page." : "Review rejected and removed from the pending queue.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to moderate this review.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#090b0e] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to Watchora</Link>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Trust & safety</p>
            <h1 className="mt-2 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Review moderation</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/45">Read community submissions and approve only reviews that meet Watchora’s community standards.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#d9b779]/20 bg-[#d9b779]/[.05] px-4 py-2 text-xs text-[#d9b779]"><ShieldCheck size={14}/> Admin workspace</div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Awaiting review</p><p className="mt-2 font-['Manrope'] text-3xl font-semibold tabular-nums">{reviews.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Queue status</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><Clock3 size={15} className="text-[#d9b779]"/> {loading ? "Loading" : "Up to date"}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Visibility rule</p><p className="mt-2 text-sm font-semibold">Approval required</p></div>
        </div>
        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-sm text-emerald-200">{notice}</p>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[.05] p-4 text-sm text-red-200">{error}<button onClick={() => void load()} className="ml-3 underline underline-offset-4">Retry</button></div>}
        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="font-['Manrope'] text-xl font-semibold">Pending submissions</h2>
          <button onClick={() => void load()} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white">Refresh queue</button>
        </div>
        {loading ? <p className="py-12 text-center text-sm text-white/40">Loading moderation queue…</p> : reviews.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
            <ShieldCheck size={26} className="mx-auto text-white/25"/>
            <p className="mt-4 text-sm font-medium text-white/65">You’re all caught up</p>
            <p className="mt-1 text-xs text-white/35">New submissions awaiting moderation will appear here.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => {
              const film = films.find((item) => item.id === review.title_id);
              const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
              return <article key={review.id} className="rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#d9b779]">{film ? film.title : `Catalogue title #${review.title_id}`}</p>
                    <p className="mt-1 text-xs text-white/40">By {profile?.display_name || "Watchora member"} · {new Date(review.created_at).toLocaleString()}</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{review.rating}/5 stars</div>
                </div>
                {review.contains_spoilers && <p className="mt-4 inline-flex rounded-full border border-[#d9b779]/20 bg-[#d9b779]/[.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d9b779]">Contains spoilers</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">{review.body}</p>
                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
                  <button disabled={busyId === review.id} onClick={() => void moderate(review.id, "rejected")} className="inline-flex items-center gap-2 rounded-full border border-red-300/20 px-4 py-2.5 text-xs text-red-200 transition hover:bg-red-300/10 disabled:opacity-40"><X size={14}/> Reject</button>
                  <button disabled={busyId === review.id} onClick={() => void moderate(review.id, "approved")} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-4 py-2.5 text-xs font-semibold text-[#17130c] transition hover:bg-[#edce94] disabled:opacity-40"><Check size={14}/> Approve</button>
                </div>
              </article>;
            })}
          </div>
        )}
        <ReviewCommentModeration />
        <ReviewReportsPanel />
      </div>
    </main>
  );
}
