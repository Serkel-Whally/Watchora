"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CornerDownRight, Eye, MessageCircle, Send } from "lucide-react";

type Comment = {
  id: string;
  review_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  contains_spoilers: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: { display_name?: string } | { display_name?: string }[] | null;
};

function authorName(comment: Comment) {
  const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
  return profile?.display_name || "Watchora member";
}

export default function ReviewComments({ reviewId }: { reviewId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [spoilers, setSpoilers] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/reviews/" + reviewId + "/comments", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load discussion.");
      setComments(Array.isArray(result.comments) ? result.comments : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load discussion.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [reviewId]);

  const roots = useMemo(() => comments.filter((comment) => !comment.parent_id), [comments]);
  const replies = useMemo(() => comments.filter((comment) => comment.parent_id), [comments]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/reviews/" + reviewId + "/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, parentId: replyTo?.id ?? null, containsSpoilers: spoilers }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/sign-in?next=" + encodeURIComponent(window.location.pathname + "#reviews");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to submit comment.");
      setBody("");
      setReplyTo(null);
      setSpoilers(false);
      setNotice("Your comment is awaiting moderation before it appears in the discussion.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit comment.");
    } finally { setBusy(false); }
  }

  function renderComment(comment: Comment, isReply = false) {
    const hidden = comment.contains_spoilers && !revealed.has(comment.id);
    return <article key={comment.id} className={"rounded-xl border border-white/[.08] bg-black/15 p-3.5 " + (isReply ? "ml-5 sm:ml-8" : "")}>
      <div className="flex flex-wrap items-center justify-between gap-2"><Link href={"/members/" + comment.author_id} className="text-[11px] font-semibold text-white/75 hover:text-[#d9b779]">{authorName(comment)}</Link><span className="text-[10px] text-white/30">{comment.status === "pending" ? "Awaiting moderation" : new Date(comment.created_at).toLocaleDateString()}</span></div>
      {hidden ? <div className="mt-2 rounded-lg border border-[#d9b779]/15 bg-[#d9b779]/[.04] p-3"><p className="text-[11px] text-[#d9b779]">Spoiler-marked comment</p><button type="button" onClick={() => setRevealed((current) => new Set(current).add(comment.id))} className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/65 hover:text-white"><Eye size={12}/> Reveal comment</button></div> : <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-white/65">{comment.body}</p>}
      {!isReply && comment.status === "approved" && <button type="button" onClick={() => { setReplyTo(comment); setNotice(""); }} className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-white/40 hover:text-[#d9b779]"><CornerDownRight size={12}/> Reply</button>}
    </article>;
  }

  return <div id={"discussion-" + reviewId} className="mt-4 border-t border-white/[.07] pt-4">
    <div className="flex items-center gap-2 text-xs font-semibold text-white/65"><MessageCircle size={13}/> Discussion <span className="font-normal text-white/30">{comments.filter((comment) => comment.status === "approved").length}</span></div>
    {loading ? <p className="mt-3 text-[11px] text-white/35">Loading discussion…</p> : roots.length ? <div className="mt-3 space-y-2">{roots.map((root) => <div key={root.id} className="space-y-2">{renderComment(root)}{replies.filter((reply) => reply.parent_id === root.id).map((reply) => renderComment(reply, true))}</div>)}</div> : <p className="mt-3 text-[11px] text-white/35">No comments yet. Start a thoughtful discussion.</p>}
    <form onSubmit={submit} className="mt-4 rounded-xl border border-white/[.08] bg-black/20 p-3.5">
      {replyTo && <div className="mb-2 flex items-center justify-between text-[10px] text-[#d9b779]">Replying to {authorName(replyTo)}<button type="button" onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white">Cancel</button></div>}
      <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={600} rows={2} placeholder={replyTo ? "Write a thoughtful reply…" : "Add to the discussion…"} className="w-full resize-y bg-transparent text-xs leading-6 text-white outline-none placeholder:text-white/25" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-2"><label className="flex items-center gap-2 text-[10px] text-white/40"><input type="checkbox" checked={spoilers} onChange={(event) => setSpoilers(event.target.checked)} className="accent-[#d9b779]"/> Contains spoilers</label><span className="ml-auto text-[10px] text-white/25">{body.length}/600</span><button type="submit" disabled={busy || body.trim().length < 2} className="inline-flex items-center gap-1.5 rounded-full bg-[#d9b779] px-3 py-2 text-[10px] font-semibold text-[#17130c] disabled:opacity-40"><Send size={11}/>{busy ? "Sending…" : "Comment"}</button></div>
    </form>
    {notice && <p role="status" className="mt-2 text-[10px] leading-5 text-[#d9b779]">{notice}</p>}
  </div>;
}
