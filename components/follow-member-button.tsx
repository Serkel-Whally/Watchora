"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";

export default function FollowMemberButton({
  memberId,
  initialFollowing,
  initialFollowers,
  initialFollowingCount,
  signedIn,
}: {
  memberId: string;
  initialFollowing: boolean;
  initialFollowers: number;
  initialFollowingCount: number;
  signedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (!signedIn) return;
    setBusy(true);
    setError("");
    try {
      const response = following
        ? await fetch(`/api/follows?memberId=${encodeURIComponent(memberId)}`, { method: "DELETE" })
        : await fetch("/api/follows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update follow.");
      setFollowing(Boolean(data.following));
      setFollowers((count) => Math.max(0, count + (data.following ? 1 : -1)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update follow.");
    } finally { setBusy(false); }
  }

  return <div className="mt-6 flex flex-wrap items-center gap-3">
    {signedIn ? <button onClick={() => void toggle()} disabled={busy} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${following ? "border border-white/15 bg-white/[.04] text-white/75 hover:border-red-300/30 hover:text-red-200" : "bg-[#d9b779] text-[#17130d] hover:bg-[#edce94]"}`}>
      {following ? <Check size={14}/> : <UserPlus size={14}/>} {busy ? "Updating…" : following ? "Following" : "Follow member"}
    </button> : <Link href={`/sign-in?next=${encodeURIComponent(`/members/${memberId}`)}`} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-2.5 text-xs font-semibold text-[#17130d]"><UserPlus size={14}/> Sign in to follow</Link>}
    <span className="text-xs text-white/40"><strong className="font-semibold text-white/70">{followers}</strong> followers <span className="px-1">·</span> <strong className="font-semibold text-white/70">{initialFollowingCount}</strong> following</span>
    {error && <p role="alert" className="basis-full text-xs text-red-300">{error}</p>}
  </div>;
}
