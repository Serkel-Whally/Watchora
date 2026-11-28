"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film, Plus, Search, Pencil, X, Check, LoaderCircle, Clapperboard, LibraryBig, Eye, Archive, AlertCircle } from "lucide-react";

type TitleKind = "Film" | "Series" | "Anime" | "Documentary";
type TitleStatus = "draft" | "published" | "archived";
type CatalogueTitle = {
  id: number; title: string; slug: string; kind: TitleKind; description: string;
  release_year: number | null; genres: string[]; country: string; original_language: string;
  poster_url: string | null; backdrop_url: string | null; status: TitleStatus;
  created_at: string; updated_at: string;
};

type EditorValues = {
  title: string; slug: string; kind: TitleKind; description: string; release_year: string;
  genres: string; country: string; original_language: string; poster_url: string;
  backdrop_url: string; status: TitleStatus;
};

const emptyValues: EditorValues = {
  title: "", slug: "", kind: "Film", description: "", release_year: "",
  genres: "", country: "", original_language: "en", poster_url: "", backdrop_url: "", status: "draft",
};

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#111319] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9b779]/60";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.13em] text-white/45";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function statusLabel(status: TitleStatus) {
  return status === "published" ? "Published" : status === "archived" ? "Archived" : "Draft";
}

export default function AdminStudio() {
  const [titles, setTitles] = useState<CatalogueTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TitleStatus>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [values, setValues] = useState<EditorValues>(emptyValues);

  const loadTitles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/catalogue", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load the catalogue.");
      setTitles(result.titles ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the catalogue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTitles(); }, [loadTitles]);

  const counts = useMemo(() => ({
    total: titles.length,
    published: titles.filter((title) => title.status === "published").length,
    drafts: titles.filter((title) => title.status === "draft").length,
    archived: titles.filter((title) => title.status === "archived").length,
  }), [titles]);

  const filtered = useMemo(() => titles.filter((title) => {
    const matchesQuery = !query || [title.title, title.slug, title.kind, title.country, ...title.genres]
      .join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "all" || title.status === filter);
  }), [titles, query, filter]);

  function openNew() {
    setEditingId(null);
    setValues(emptyValues);
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function openEdit(title: CatalogueTitle) {
    setEditingId(title.id);
    setValues({
      title: title.title, slug: title.slug, kind: title.kind, description: title.description,
      release_year: title.release_year?.toString() ?? "", genres: title.genres.join(", "),
      country: title.country, original_language: title.original_language,
      poster_url: title.poster_url ?? "", backdrop_url: title.backdrop_url ?? "", status: title.status,
    });
    setError("");
    setNotice("");
    setEditorOpen(true);
  }

  function update<K extends keyof EditorValues>(key: K, value: EditorValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      ...values,
      release_year: values.release_year ? Number(values.release_year) : null,
      genres: values.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
      poster_url: values.poster_url.trim() || null,
      backdrop_url: values.backdrop_url.trim() || null,
    };
    try {
      const response = await fetch("/api/admin/catalogue", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save this title.");
      setNotice(editingId ? "Title updated successfully." : "Title added to your catalogue.");
      setEditorOpen(false);
      await loadTitles();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save this title.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#090a0d]/90 backdrop-blur-xl">
        <div className="shell flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Watchora" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/25 hover:text-white"><ArrowLeft size={16}/></Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9b779]/10 text-[#d9b779]"><Clapperboard size={18}/></div>
              <div><p className="font-['Manrope'] text-sm font-extrabold tracking-[-.04em]">watchora<span className="text-[#d9b779]">.</span></p><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">Admin Studio</p></div>
            </div>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-4 py-2.5 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94]"><Plus size={15}/> <span className="hidden sm:inline">Add title</span><span className="sm:hidden">Add</span></button>
        </div>
      </header>

      <div className="shell pb-20 pt-9 sm:pt-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9b779]">Content operations</p><h1 className="mt-2 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Your catalogue, <span className="text-white/35">under control.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Create and maintain Watchora titles. Drafts stay private until you deliberately publish them.</p></div>
          <div className="flex items-center gap-2 text-[11px] text-white/35"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Protected workspace</div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total titles", value: counts.total, icon: LibraryBig },
            { label: "Published", value: counts.published, icon: Eye },
            { label: "Drafts", value: counts.drafts, icon: Film },
            { label: "Archived", value: counts.archived, icon: Archive },
          ].map((item) => <div key={item.label} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4 sm:p-5"><div className="flex items-center justify-between text-white/35"><span className="text-[10px] font-semibold uppercase tracking-[.13em]">{item.label}</span><item.icon size={15}/></div><p className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-tight">{item.value}</p></div>)}
        </div>

        {notice && <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-3 text-xs text-emerald-200"><Check size={15}/>{notice}</div>}
        {error && !editorOpen && <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-200"><AlertCircle size={15}/>{error}<button onClick={() => void loadTitles()} className="ml-auto underline">Retry</button></div>}

        <section className="mt-9 overflow-hidden rounded-2xl border border-white/[.08] bg-[#0d0f13]">
          <div className="flex flex-col gap-4 border-b border-white/[.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div><h2 className="font-['Manrope'] text-lg font-semibold">Content library</h2><p className="mt-1 text-[11px] text-white/35">Manage titles and their publication status.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles..." className="w-full rounded-xl border border-white/10 bg-white/[.025] py-2.5 pl-9 pr-3 text-xs outline-none placeholder:text-white/25 focus:border-[#d9b779]/50 sm:w-52"/></div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-white/10 bg-[#111319] px-3 py-2.5 text-xs text-white/70 outline-none"><option value="all">All statuses</option><option value="draft">Drafts</option><option value="published">Published</option><option value="archived">Archived</option></select>
            </div>
          </div>

          {loading ? <div className="flex items-center justify-center gap-2 py-20 text-xs text-white/40"><LoaderCircle size={16} className="animate-spin"/> Loading catalogue...</div>
            : filtered.length === 0 ? <div className="px-6 py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[.04] text-white/30"><Film size={20}/></div><p className="mt-4 text-sm font-medium">{titles.length ? "No matching titles" : "Your content library is empty"}</p><p className="mt-1 text-xs text-white/35">{titles.length ? "Try another search or status filter." : "Add your first title to start building the Watchora catalogue."}</p>{!titles.length && <button onClick={openNew} className="mt-5 rounded-full bg-[#d9b779] px-4 py-2.5 text-xs font-bold text-[#17130d]">Add your first title</button>}</div>
            : <div className="divide-y divide-white/[.055]">
              {filtered.map((title) => <div key={title.id} className="flex items-center gap-3 p-3.5 transition hover:bg-white/[.02] sm:gap-4 sm:px-5">
                <div className="h-[66px] w-12 shrink-0 overflow-hidden rounded-lg bg-white/[.05] sm:h-[76px] sm:w-[54px]">{title.poster_url ? <img src={title.poster_url} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-white/20"><Film size={18}/></div>}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{title.title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${title.status === "published" ? "bg-emerald-400/10 text-emerald-300" : title.status === "archived" ? "bg-white/10 text-white/40" : "bg-amber-300/10 text-amber-200"}`}>{statusLabel(title.status)}</span></div><p className="mt-1 truncate text-[11px] text-white/40">{title.kind}{title.release_year ? ` · ${title.release_year}` : ""}{title.country ? ` · ${title.country}` : ""}</p><p className="mt-1 truncate text-[10px] text-white/25">{title.genres.join(" · ") || "No genres assigned"}</p></div>
                <button onClick={() => openEdit(title)} aria-label={`Edit ${title.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#d9b779]/50 hover:text-[#d9b779]"><Pencil size={14}/></button>
              </div>)}
            </div>}
          <div className="border-t border-white/[.06] px-5 py-3 text-[10px] text-white/25">Showing {filtered.length} of {titles.length} titles · Maximum 250 per view</div>
        </section>
        <p className="mx-auto mt-6 max-w-2xl text-center text-[10px] leading-5 text-white/25">Publishing a title makes its catalogue metadata public. It does not grant video distribution rights or automatically attach a playable stream. Configure licensed media assets and territory rights separately before enabling playback.</p>
      </div>

      {editorOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditorOpen(false); }}>
        <section className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0f13] shadow-2xl sm:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[.07] bg-[#0d0f13]/95 px-5 py-4 backdrop-blur sm:px-7"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d9b779]">{editingId ? "Edit catalogue entry" : "New catalogue entry"}</p><h2 className="mt-1 font-['Manrope'] text-xl font-semibold">{editingId ? "Update title" : "Add a title"}</h2></div><button onClick={() => setEditorOpen(false)} disabled={saving} aria-label="Close editor" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white"><X size={16}/></button></div>
          <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
            {error && <div className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-200">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className={labelClass}>Title name *</span><input required maxLength={180} value={values.title} onChange={(event) => { update("title", event.target.value); if (!editingId) update("slug", slugify(event.target.value)); }} placeholder="Enter the official title" className={inputClass}/></label>
              <label><span className={labelClass}>URL slug *</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={(event) => update("slug", slugify(event.target.value))} placeholder="my-movie-title" className={inputClass}/></label>
              <label><span className={labelClass}>Content type *</span><select value={values.kind} onChange={(event) => update("kind", event.target.value as TitleKind)} className={inputClass}><option>Film</option><option>Series</option><option>Anime</option><option>Documentary</option></select></label>
              <label><span className={labelClass}>Release year</span><input type="number" min="1888" max="2200" value={values.release_year} onChange={(event) => update("release_year", event.target.value)} placeholder="2026" className={inputClass}/></label>
              <label><span className={labelClass}>Publication status</span><select value={values.status} onChange={(event) => update("status", event.target.value as TitleStatus)} className={inputClass}><option value="draft">Draft — private</option><option value="published">Published — public metadata</option><option value="archived">Archived — hidden</option></select></label>
              <label><span className={labelClass}>Country</span><input maxLength={100} value={values.country} onChange={(event) => update("country", event.target.value)} placeholder="Country of origin" className={inputClass}/></label>
              <label><span className={labelClass}>Original language</span><input maxLength={20} value={values.original_language} onChange={(event) => update("original_language", event.target.value)} placeholder="en" className={inputClass}/></label>
              <label className="sm:col-span-2"><span className={labelClass}>Genres</span><input value={values.genres} onChange={(event) => update("genres", event.target.value)} placeholder="Drama, Thriller, Adventure" className={inputClass}/><span className="mt-1 block text-[10px] text-white/25">Separate genres with commas. Maximum 12.</span></label>
              <label className="sm:col-span-2"><span className={labelClass}>Synopsis</span><textarea rows={4} maxLength={5000} value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Write a concise description..." className={inputClass+" resize-y"}/></label>
              <label className="sm:col-span-2"><span className={labelClass}>Poster image URL</span><input type="url" value={values.poster_url} onChange={(event) => update("poster_url", event.target.value)} placeholder="https://..." className={inputClass}/></label>
              <label className="sm:col-span-2"><span className={labelClass}>Backdrop image URL</span><input type="url" value={values.backdrop_url} onChange={(event) => update("backdrop_url", event.target.value)} placeholder="https://..." className={inputClass}/></label>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-white/[.07] pt-5 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setEditorOpen(false)} className="rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-white/60 hover:text-white">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9b779] px-6 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94] disabled:opacity-60">{saving ? <LoaderCircle size={14} className="animate-spin"/> : <Check size={14}/>} {saving ? "Saving..." : editingId ? "Save changes" : "Create title"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
