"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Star, Trash2, ShieldCheck } from "lucide-react";

type CommunityReview = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  profiles?: { display_name?: string } | { display_name?: string }[] | null;
};
type OwnReview = {
  id: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function TitleReviews({ titleId, title }: { titleId: number; title: string }) {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [ownReview, setOwnReview] = useState<OwnReview | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [configured, setConfigured] = useState(true);

  async function loadReviews() {
    setReady(false);
    try {
      const [publicResponse, ownResponse] = await Promise.all([
        fetch(`/api/reviews?titleId=${titleId}`, { cache: "no-store" }),
        fetch(`/api/reviews/mine?titleId=${titleId}`, { cache: "no-store" }),
      ]);
      if (publicResponse.status === 503 || ownResponse.status === 503) {
        setConfigured(false);
        return;
      }
      if (!publicResponse.ok) throw new Error("Unable to load community reviews.");
      const publicData = await publicResponse.json();
      setReviews(Array.isArray(publicData.reviews) ? publicData.reviews : []);
      if (ownResponse.ok) {
        const ownData = await ownResponse.json();
        setOwnReview(ownData.review ?? null);
      } else {
        setOwnReview(null);
      }
      setConfigured(true);
    } catch {
      setNotice("We couldn’t load reviews just now. Please try again.");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { void loadReviews(); }, [titleId]);

  const average = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews]
  );

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!rating || trimmed.length < 12) {
      setNotice("Choose a rating and write at least 12 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId, rating, body: trimmed }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = `/sign-in?next=${encodeURIComponent(`/title/${titleId}#reviews`)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error || "Your review could not be submitted.");
      setBody("");
      setRating(0);
      setNotice("Your review was submitted and is awaiting moderation before it appears publicly.");
      await loadReviews();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your review could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  async function removeReview() {
    if (!ownReview) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/reviews/${ownReview.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to remove your review.");
      setOwnReview(null);
      setNotice("Your review has been removed.");
      await loadReviews();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to remove your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="reviews" className="border-t border-white/[.08] bg-[#090b0e] py-14 md:py-16">
      <div className="shell">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <p className="eyebrow">The community&apos;s take</p>
            <h2 className="mt-2 font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">Reviews & ratings</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
              Share what you thought of {title}. Be thoughtful, be respectful, and help someone choose their next story.
            </p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="flex items-end gap-3">
                <span className="font-['Manrope'] text-4xl font-semibold tabular-nums text-white">{reviews.length ? average.toFixed(1) : "—"}</span>
                <span className="pb-1 text-xs text-white/40">out of 5</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[#d9b779]">
                {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} fill={value <= Math.round(average) ? "currentColor" : "none"} />)}
              </div>
              <p className="mt-2 text-xs text-white/40">{reviews.length} public {reviews.length === 1 ? "review" : "reviews"}</p>
            </div>
            <div className="mt-4 flex gap-2 rounded-xl border border-[#d9b779]/15 bg-[#d9b779]/[.04] p-4">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/>
              <p className="text-xs leading-6 text-white/45">Reviews are submitted under a member account and checked before publication. Only approved reviews contribute to the public score.</p>
            </div>
          </div>

          <div>
            {!configured ? (
              <div className="rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.05] p-6">
                <h3 className="font-['Manrope'] text-lg font-semibold text-white">Community reviews are coming soon</h3>
                <p className="mt-2 text-sm leading-7 text-white/45">The review service has not been connected yet. Public ratings and submissions will appear here once the Watchora database is configured.</p>
              </div>
            ) : ownReview ? (
              <div className="rounded-2xl border border-white/10 bg-[#101216] p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-['Manrope'] text-lg font-semibold text-white">Your review</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${ownReview.status === "approved" ? "bg-emerald-400/10 text-emerald-300" : ownReview.status === "rejected" ? "bg-red-400/10 text-red-300" : "bg-[#d9b779]/10 text-[#d9b779]"}`}>{ownReview.status}</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[#d9b779]">{[1,2,3,4,5].map((value) => <Star key={value} size={15} fill={value <= ownReview.rating ? "currentColor" : "none"}/>)}</div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{ownReview.body}</p>
                <p className="mt-3 text-[10px] text-white/30">{new Date(ownReview.created_at).toLocaleDateString()}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/40">{ownReview.status === "pending" ? "Your review is waiting for a moderator." : ownReview.status === "rejected" ? "This review was not approved for public display." : "Your review is visible to the community."}</p>
                  <button type="button" disabled={busy} onClick={removeReview} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/45 transition hover:bg-white/[.06] hover:text-red-300 disabled:opacity-50"><Trash2 size={13}/> Remove review</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitReview} className="rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-7">
                <h3 className="font-['Manrope'] text-lg font-semibold text-white">Write a review</h3>
                <p className="mt-1 text-xs text-white/40">What stood out? What should others know?</p>
                <div className="mt-6">
                  <p className="mb-3 text-xs font-medium text-white/65">Your rating</p>
                  <div className="flex items-center gap-2" role="radiogroup" aria-label="Your rating">
                    {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} out of 5 stars`} onClick={() => setRating(value)} className="rounded-lg p-1.5 text-[#d9b779] transition hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b779]"><Star size={25} fill={value <= rating ? "currentColor" : "none"} /></button>)}
                    <span className="ml-2 text-xs text-white/40">{rating ? `${rating}/5` : "Select a rating"}</span>
                  </div>
                </div>
                <label htmlFor={`review-body-${titleId}`} className="mt-6 block text-xs font-medium text-white/65">Your review</label>
                <textarea id={`review-body-${titleId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={5} placeholder="Tell us what you thought about the story, performances, or filmmaking..." className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#d9b779]/50" />
                <div className="mt-2 flex justify-between text-[11px] text-white/30"><span>Keep it kind and spoiler-aware.</span><span>{body.length}/1000</span></div>
                <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-white/35">One review per title per account.</p>
                  <button type="submit" disabled={busy || !ready} className="rounded-full bg-[#d9b779] px-5 py-3 text-xs font-semibold text-[#17130c] transition hover:bg-[#edce94] disabled:opacity-50">{busy ? "Submitting…" : "Submit review"}</button>
                </div>
                <p className="mt-3 text-xs text-white/35">You’ll need to <Link href={`/sign-in?next=${encodeURIComponent(`/title/${titleId}#reviews`)}`} className="text-[#d9b779] hover:text-[#edce94]">sign in</Link> before submitting. New reviews are moderated.</p>
              </form>
            )}

            {notice && <p role="status" className="mt-4 text-xs leading-5 text-[#d9b779]">{notice}</p>}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-['Manrope'] text-lg font-semibold text-white">Community reviews</h3>
                <span className="text-xs text-white/35">{reviews.length} approved</span>
              </div>
              {!ready ? <p className="mt-5 text-sm text-white/40">Loading reviews…</p> : reviews.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
                  <MessageSquareText size={22} className="mx-auto text-white/25"/>
                  <p className="mt-3 text-sm text-white/55">No published reviews yet</p>
                  <p className="mt-1 text-xs text-white/35">Be the first to share your thoughts.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => {
                    const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                    return <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-white/70">{profile?.display_name || "Watchora member"}</p>
                        <div className="flex items-center gap-1 text-[#d9b779]" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={12} fill={value <= review.rating ? "currentColor" : "none"}/>)}</div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{review.body}</p>
                      <p className="mt-3 text-[10px] text-white/30">{new Date(review.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                    </article>;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
