"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Tv, LoaderCircle, Check, X, Clapperboard, AlertCircle } from "lucide-react";

type Episode = {
  id: number; title_id: number; season_number: number; episode_number: number;
  title: string; description: string; runtime_minutes: number | null; status: "draft" | "published" | "archived";
};
type ParentTitle = { id: number; title: string; kind: string; status: string };
type EpisodeForm = { season_number: string; episode_number: string; title: string; description: string; runtime_minutes: string; status: Episode["status"] };
const blank: EpisodeForm = { season_number: "1", episode_number: "1", title: "", description: "", runtime_minutes: "", status: "draft" };
const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#111319] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9b779]/60";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.13em] text-white/45";

export default function EpisodeManager({ titleId }: { titleId: number }) {
  const [parent, setParent] = useState<ParentTitle | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [values, setValues] = useState<EpisodeForm>(blank);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalogueResponse, episodeResponse] = await Promise.all([
        fetch("/api/admin/catalogue", { cache: "no-store" }),
        fetch(`/api/admin/episodes?titleId=${titleId}`, { cache: "no-store" }),
      ]);
      const catalogue = await catalogueResponse.json();
      const episodeData = await episodeResponse.json();
      if (!catalogueResponse.ok) throw new Error(catalogue.error || "Unable to load the series.");
      if (!episodeResponse.ok) throw new Error(episodeData.error || "Unable to load episodes.");
      const found = (catalogue.titles ?? []).find((item: ParentTitle) => item.id === titleId);
      if (!found) throw new Error("Series not found in the catalogue.");
      if (found.kind !== "Series") throw new Error("Episodes can only be managed for series titles.");
      setParent(found);
      setEpisodes(episodeData.episodes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load episode manager.");
    } finally {
      setLoading(false);
    }
  }, [titleId]);

  useEffect(() => { void load(); }, [load]);

  const seasons = useMemo(() => {
    const grouped = new Map<number, Episode[]>();
    episodes.forEach((episode) => {
      const list = grouped.get(episode.season_number) ?? [];
      list.push(episode);
      grouped.set(episode.season_number, list);
    });
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  function openNew(season = 1) {
    const nextEpisode = episodes.filter((item) => item.season_number === season).reduce((max, item) => Math.max(max, item.episode_number), 0) + 1;
    setEditingId(null);
    setValues({ ...blank, season_number: String(season), episode_number: String(nextEpisode) });
    setError("");
    setEditorOpen(true);
  }

  function openEdit(episode: Episode) {
    setEditingId(episode.id);
    setValues({
      season_number: String(episode.season_number), episode_number: String(episode.episode_number),
      title: episode.title, description: episode.description,
      runtime_minutes: episode.runtime_minutes?.toString() ?? "", status: episode.status,
    });
    setError("");
    setEditorOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/episodes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title_id: titleId,
          season_number: Number(values.season_number),
          episode_number: Number(values.episode_number),
          title: values.title,
          description: values.description,
          runtime_minutes: values.runtime_minutes ? Number(values.runtime_minutes) : null,
          status: values.status,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save episode.");
      setEditorOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save episode.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEpisode(episode: Episode) {
    if (!window.confirm(`Delete S${String(episode.season_number).padStart(2, "0")}E${String(episode.episode_number).padStart(2, "0")} — ${episode.title}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/episodes?id=${episode.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete episode.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete episode.");
    }
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <header className="border-b border-white/[.07] bg-[#090a0d]">
        <div className="shell flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Link href="/admin/studio" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white"><ArrowLeft size={16}/></Link><div className="flex items-center gap-2"><Clapperboard size={18} className="text-[#d9b779]"/><span className="font-['Manrope'] text-sm font-extrabold">watchora<span className="text-[#d9b779]">.</span></span></div></div>
          <button onClick={() => openNew()} disabled={!parent} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-4 py-2.5 text-xs font-bold text-[#17130d] disabled:opacity-40"><Plus size={15}/> Add episode</button>
        </div>
      </header>
      <div className="shell pb-20 pt-9 sm:pt-12">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9b779]">Series operations</p>
        <h1 className="mt-2 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Season & episode manager</h1>
        <p className="mt-2 text-sm text-white/40">{parent ? parent.title : "Loading series details..."}</p>
        {error && <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-200"><AlertCircle size={15}/>{error}<button onClick={() => void load()} className="ml-auto underline">Retry</button></div>}
        {loading ? <div className="flex items-center justify-center gap-2 py-24 text-xs text-white/40"><LoaderCircle size={16} className="animate-spin"/> Loading episodes...</div>
          : seasons.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center"><Tv size={26} className="mx-auto text-white/25"/><h2 className="mt-4 text-sm font-semibold">No episodes yet</h2><p className="mt-1 text-xs text-white/35">Create the first episode for this series.</p><button onClick={() => openNew()} className="mt-5 rounded-full bg-[#d9b779] px-5 py-2.5 text-xs font-bold text-[#17130d]">Add first episode</button></div>
          : <div className="mt-8 space-y-5">{seasons.map(([season, items]) => <section key={season} className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#0d0f13]"><div className="flex items-center justify-between border-b border-white/[.07] px-4 py-4 sm:px-5"><div><h2 className="font-['Manrope'] text-lg font-semibold">Season {season}</h2><p className="mt-1 text-[10px] text-white/35">{items.length} {items.length === 1 ? "episode" : "episodes"}</p></div><button onClick={() => openNew(season)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/65 hover:border-[#d9b779]/40 hover:text-[#d9b779]"><Plus size={13}/> Add episode</button></div><div className="divide-y divide-white/[.05]">{items.map((episode) => <div key={episode.id} className="flex items-center gap-3 px-4 py-4 sm:px-5"><div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[.04] font-mono text-[10px] text-white/50">E{String(episode.episode_number).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{episode.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${episode.status === "published" ? "bg-emerald-400/10 text-emerald-300" : episode.status === "archived" ? "bg-white/10 text-white/40" : "bg-amber-300/10 text-amber-200"}`}>{episode.status}</span></div><p className="mt-1 truncate text-[10px] text-white/35">{episode.runtime_minutes ? `${episode.runtime_minutes} min · ` : ""}{episode.description || "No episode description"}</p></div><button onClick={() => openEdit(episode)} aria-label="Edit episode" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/45 hover:text-[#d9b779]"><Pencil size={13}/></button><button onClick={() => void removeEpisode(episode)} aria-label="Delete episode" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/35 hover:border-rose-400/30 hover:text-rose-300"><Trash2 size={13}/></button></div>)}</div></section>)}</div>}
      </div>
      {editorOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditorOpen(false); }}><section className="w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0f13] shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d9b779]">Episode editor</p><h2 className="mt-1 font-['Manrope'] text-lg font-semibold">{editingId ? "Edit episode" : "Add episode"}</h2></div><button onClick={() => setEditorOpen(false)} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50"><X size={16}/></button></div><form onSubmit={submit} className="space-y-4 p-5 sm:p-6"><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Season number</span><input type="number" min="1" max="100" required value={values.season_number} onChange={(event) => setValues((v) => ({ ...v, season_number: event.target.value }))} className={inputClass}/></label><label><span className={labelClass}>Episode number</span><input type="number" min="1" max="500" required value={values.episode_number} onChange={(event) => setValues((v) => ({ ...v, episode_number: event.target.value }))} className={inputClass}/></label></div><label className="block"><span className={labelClass}>Episode title *</span><input required maxLength={180} value={values.title} onChange={(event) => setValues((v) => ({ ...v, title: event.target.value }))} placeholder="Episode title" className={inputClass}/></label><label className="block"><span className={labelClass}>Description</span><textarea rows={3} maxLength={3000} value={values.description} onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))} placeholder="Episode synopsis" className={inputClass+" resize-y"}/></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Runtime (minutes)</span><input type="number" min="1" max="1000" value={values.runtime_minutes} onChange={(event) => setValues((v) => ({ ...v, runtime_minutes: event.target.value }))} placeholder="45" className={inputClass}/></label><label><span className={labelClass}>Status</span><select value={values.status} onChange={(event) => setValues((v) => ({ ...v, status: event.target.value as Episode["status"] }))} className={inputClass}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div><div className="flex flex-col-reverse gap-2 border-t border-white/[.07] pt-4 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-white/60">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9b779] px-6 py-3 text-xs font-bold text-[#17130d] disabled:opacity-60">{saving ? <LoaderCircle size={14} className="animate-spin"/> : <Check size={14}/>} {saving ? "Saving..." : editingId ? "Save episode" : "Create episode"}</button></div></form></section></div>}
    </main>
  );
}
