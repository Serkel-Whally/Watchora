"use client";

import { useEffect, useState } from "react";
import { Check, Flag, X } from "lucide-react";
import { films } from "@/lib/catalogue";

type Report = {
  id: string;
  review_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  title_reviews: { title_id: number; body: string; rating: number; contains_spoilers: boolean; status: string } | { title_id: number; body: string; rating: number; contains_spoilers: boolean; status: string }[];
};

export default function ReviewReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/review-reports", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load reports.");
      setReports(Array.isArray(result.reports) ? result.reports : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function resolve(id: string, status: "resolved" | "dismissed") {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/admin/review-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update report.");
      setReports((current) => current.filter((report) => report.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update report.");
    } finally {
      setBusy("");
    }
  }

  return <section className="mt-14">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">Community safety</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold">Reported reviews</h2><p className="mt-1 text-sm text-white/40">Reports are private to moderators. Resolve or dismiss each report after review.</p></div>
      <button onClick={() => void load()} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white">Refresh reports</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</p>}
    {loading ? <p className="py-8 text-sm text-white/40">Loading reports…</p> : reports.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center"><Flag size={22} className="mx-auto text-white/25"/><p className="mt-3 text-sm text-white/55">No open reports</p></div> : <div className="mt-4 space-y-3">
      {reports.map((report) => {
        const review = Array.isArray(report.title_reviews) ? report.title_reviews[0] : report.title_reviews;
        const film = review ? films.find((item) => item.id === review.title_id) : undefined;
        return <article key={report.id} className="rounded-2xl border border-white/10 bg-[#101216] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#d9b779]">{film?.title || "Catalogue title"} · {report.reason.replaceAll("_", " ")}</p><span className="text-[10px] text-white/35">{new Date(report.created_at).toLocaleString()}</span></div>
          {review && <><p className="mt-3 text-xs text-white/40">{review.rating}/5 stars {review.contains_spoilers ? "· Marked as spoiler" : ""} · Review status: {review.status}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">{review.body}</p></>}
          {report.details && <p className="mt-3 rounded-lg bg-white/[.04] p-3 text-xs leading-6 text-white/55">Reporter note: {report.details}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4"><button disabled={busy === report.id} onClick={() => void resolve(report.id, "dismissed")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 disabled:opacity-40"><X size={13}/> Dismiss report</button><button disabled={busy === report.id} onClick={() => void resolve(report.id, "resolved")} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-4 py-2 text-xs font-semibold text-[#17130c] disabled:opacity-40"><Check size={13}/> Mark resolved</button></div>
        </article>;
      })}
    </div>}
  </section>;
}
