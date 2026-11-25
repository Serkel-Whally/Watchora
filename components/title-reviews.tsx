"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, Star, Trash2 } from "lucide-react";

type LocalReview = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
};

function storageKey(titleId: number) {
  return `watchora-local-reviews-${titleId}`;
}

export default function TitleReviews({ titleId, title }: { titleId: number; title: string }) {
  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(titleId));
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setReviews(parsed.filter((item): item is LocalReview =>
          item && typeof item.id === "string" &&
          Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 &&
          typeof item.body === "string" && typeof item.createdAt === "string"
        ));
      }
    } catch {
      setReviews([]);
    }
    setReady(true);
  }, [titleId]);

  const average = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews]
  );

  function persist(next: LocalReview[]) {
    setReviews(next);
    try {
      localStorage.setItem(storageKey(titleId), JSON.stringify(next));
      setNotice("Your review is saved on this device. It has not been published publicly.");
    } catch {
      setNotice("Your browser could not save this review. Check available device storage and try again.");
    }
  }

  function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!rating || trimmed.length < 12) {
      setNotice("Choose a rating and write at least 12 characters.");
      return;
    }
    const next: LocalReview[] = [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rating,
      body: trimmed,
      createdAt: new Date().toISOString(),
    }, ...reviews];
    persist(next);
    setRating(0);
    setBody("");
  }

  function removeReview(id: string) {
    persist(reviews.filter((review) => review.id !== id));
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
              <p className="mt-2 text-xs text-white/40">{reviews.length} {reviews.length === 1 ? "review" : "reviews"} saved on this device</p>
            </div>
            <div className="mt-4 flex gap-2 rounded-xl border border-[#d9b779]/15 bg-[#d9b779]/[.04] p-4">
              <MessageSquareText size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/>
              <p className="text-xs leading-6 text-white/45">This preview stores your reviews only in this browser. They are not visible to other Watchora visitors and will not follow you to another device.</p>
            </div>
          </div>

          <div>
            <form onSubmit={submitReview} className="rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-7">
              <h3 className="font-['Manrope'] text-lg font-semibold text-white">Write a review</h3>
              <p className="mt-1 text-xs text-white/40">What stood out? What should others know?</p>
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium text-white/65">Your rating</p>
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} out of 5 stars`} onClick={() => setRating(value)} className="rounded-lg p-1.5 text-[#d9b779] transition hover:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b779]">
                      <Star size={25} fill={value <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-white/40">{rating ? `${rating}/5` : "Select a rating"}</span>
                </div>
              </div>
              <label htmlFor={`review-body-${titleId}`} className="mt-6 block text-xs font-medium text-white/65">Your review</label>
              <textarea id={`review-body-${titleId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={5} placeholder="Tell us what you thought about the story, performances, or filmmaking..." className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#d9b779]/50" />
              <div className="mt-2 flex justify-between text-[11px] text-white/30"><span>Keep it kind and spoiler-aware.</span><span>{body.length}/1000</span></div>
              <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-white/35">No account required in this local preview.</p>
                <button type="submit" disabled={!ready} className="rounded-full bg-[#d9b779] px-5 py-3 text-xs font-semibold text-[#17130c] transition hover:bg-[#edce94] disabled:opacity-50">Save review</button>
              </div>
              {notice && <p role="status" className="mt-4 text-xs leading-5 text-[#d9b779]">{notice}</p>}
            </form>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-['Manrope'] text-lg font-semibold text-white">Your saved reviews</h3>
                <span className="text-xs text-white/35">{reviews.length} total</span>
              </div>
              {!ready ? <p className="mt-5 text-sm text-white/40">Loading your reviews…</p> : reviews.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
                  <MessageSquareText size={22} className="mx-auto text-white/25"/>
                  <p className="mt-3 text-sm text-white/55">No reviews yet</p>
                  <p className="mt-1 text-xs text-white/35">Your review will appear here after you save it.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 text-[#d9b779]" aria-label={`${review.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={13} fill={value <= review.rating ? "currentColor" : "none"}/>)}
                        </div>
                        <button type="button" onClick={() => removeReview(review.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-white/35 transition hover:bg-white/[.06] hover:text-red-300" aria-label="Delete this review"><Trash2 size={13}/> Delete</button>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{review.body}</p>
                      <p className="mt-3 text-[10px] text-white/30">{new Date(review.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · Saved on this device</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
