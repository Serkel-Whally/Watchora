"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { films } from "@/lib/catalogue";

type PendingComment = {
  id: string;
  review_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  contains_spoilers: boolean;
  created_at: string;
  profiles?: { display_name?: string } | { display_name?: string }[] | null;
  title_reviews?: { title_id: number; body: string; rating: number } | { title_id: number; body: string; rating: number }[] | null;
};

function getProfileName(comment: PendingComment) {
  const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
  return profile?.display_name || "Watchora member";
}

function getReview(comment: PendingComment) {
  return Array.isArray(comment.title_reviews) ? comment.title_reviews[0] : comment.title_reviews;
}

export default function ReviewCommentModeration() {
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/comments", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/sign-in?next=%2Fadmin%2Freviews";
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to load pending comments.");
      setComments(Array.isArray(result.comments) ? result.comments : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load pending comments.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function moderate(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to moderate this comment.");
      setComments((current) => current.filter((comment) => comment.id !== id));
      setNotice(status === "approved" ? "Comment approved and added to its discussion." : "Comment rejected.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to moderate this comment.");
    } finally { setBusyId(""); }
  }

  return <section className="mt-12 border-t border-white/10 pt-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Conversation safety</p><h2 className="mt-2 font-['Manrope'] text-xl font-semibold">Pending comments</h2><p className="mt-1 text-xs text-white/40">Comments and replies remain private until approved.</p></div><button onClick={() => void load()} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white">Refresh</button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/40">Awaiting moderation</p><p className="mt-1 text-2xl font-semibold tabular-nums">{comments.length}</p></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/40">Publication rule</p><p className="mt-2 text-sm font-semibold">Approval required</p></div></div>
    {notice && <p role="status" className="mt-4 text-xs text-emerald-200">{notice}</p>}
    {error && <p role="alert" className="mt-4 text-xs text-red-200">{error}</p>}
    {loading ? <p className="py-8 text-center text-sm text-white/40">Loading comments…</p> : comments.length ? <div className="mt-4 space-y-3">{comments.map((comment) => {
      const review = getReview(comment);
      const film = review ? films.find((item) => item.id === Number(review.title_id)) : null;
      return <article key={comment.id} className="rounded-2xl border border-white/10 bg-[#101216] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-[#d9b779]">{film?.title || "Catalogue review"}</p><p className="mt-1 text-[11px] text-white/40">{getProfileName(comment)} · {new Date(comment.created_at).toLocaleString()}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{comment.parent_id ? "Reply" : "Comment"}</span></div>
        {comment.contains_spoilers && <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#d9b779]">Contains spoilers</p>}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">{comment.body}</p>
        {review && <div className="mt-4 rounded-lg bg-black/20 p-3"><p className="text-[10px] uppercase tracking-wider text-white/35">On a {review.rating}/5 review</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-white/45">{review.body}</p></div>}
        <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3"><button disabled={busyId === comment.id} onClick={() => void moderate(comment.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 px-4 py-2 text-xs text-red-200 disabled:opacity-40"><X size={13}/> Reject</button><button disabled={busyId === comment.id} onClick={() => void moderate(comment.id, "approved")} className="inline-flex items-center gap-1.5 rounded-full bg-[#d9b779] px-4 py-2 text-xs font-semibold text-[#17130c] disabled:opacity-40"><Check size={13}/> Approve</button></div>
      </article>;
    })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center"><MessageCircle size={22} className="mx-auto text-white/25"/><p className="mt-3 text-sm text-white/55">No comments awaiting review</p><p className="mt-1 text-xs text-white/35">New submissions will appear here.</p></div>}
  </section>;
}
