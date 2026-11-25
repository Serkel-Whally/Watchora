"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Download, FileJson, FileUp, ShieldCheck, XCircle } from "lucide-react";
import { importCatalogueJson, type CatalogueImportResult } from "@/lib/catalogue-import";
import type { Film } from "@/lib/catalogue";

export default function CatalogueImportReview() {
  const [source, setSource] = useState("");
  const [result, setResult] = useState<CatalogueImportResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedTitles = useMemo(
    () => (result?.titles ?? []).filter((title) => selectedIds.includes(title.id)),
    [result, selectedIds],
  );

  const processImport = (value: string) => {
    setSource(value);
    const next = importCatalogueJson(value);
    setResult(next);
    setSelectedIds(next.titles.map((title) => title.id));
    setReviewConfirmed(false);
    setError("");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose a JSON file smaller than 2 MB.");
      return;
    }
    try {
      processImport(await file.text());
    } catch {
      setError("The selected file could not be read.");
    }
  };

  const toggleTitle = (title: Film) => {
    setSelectedIds((current) =>
      current.includes(title.id)
        ? current.filter((id) => id !== title.id)
        : [...current, title.id],
    );
    setReviewConfirmed(false);
  };

  const exportApproved = () => {
    if (!result || !reviewConfirmed || selectedTitles.length === 0) return;
    const payload = JSON.stringify({ version: 1, titles: selectedTitles }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "watchora-approved-catalogue.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/[.08]">
        <div className="shell flex h-[72px] items-center justify-between">
          <Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-white/40">Local review tool</span>
        </div>
      </header>

      <section className="shell max-w-5xl py-10 md:py-14">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back to Watchora</Link>
        <p className="eyebrow mt-9">Catalogue operations</p>
        <h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-5xl">Review an import.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">Validate a canonical JSON catalogue file, inspect accepted and rejected records, then approve only the titles you want included in an export.</p>

        <div className="mt-8 rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.045] p-4 md:p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#d9b779]" size={19}/><div><p className="text-sm font-semibold text-white/85">Browser-only review</p><p className="mt-1 text-xs leading-5 text-white/45">Your file is parsed in this browser. It is not uploaded to Watchora or saved to the live catalogue. Approval creates a reviewed JSON export only; publishing still requires a reviewed Git change.</p></div></div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="font-['Manrope'] text-lg font-semibold">1. Add catalogue data</h2><FileJson size={18} className="text-white/35"/></div>
            <p className="mt-2 text-xs leading-5 text-white/40">Paste a version 1 JSON envelope or a JSON array. Maximum file size: 2 MB.</p>
            <textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={'{
  "version": 1,
  "titles": []
}'} spellCheck={false} className="mt-4 min-h-[260px] w-full resize-y rounded-xl border border-white/10 bg-[#090a0d] p-4 font-mono text-xs leading-6 text-white/75 outline-none transition placeholder:text-white/20 focus:border-[#d9b779]/60"/>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => processImport(source)} disabled={!source.trim()} className="rounded-full bg-[#d9b779] px-5 py-2.5 text-xs font-semibold text-[#17130d] transition hover:bg-[#e8c990] disabled:cursor-not-allowed disabled:opacity-40">Validate JSON</button>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/65 transition hover:border-white/30 hover:text-white"><FileUp size={14}/> Choose file</button>
              <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])}/>
              <button onClick={() => {setSource("");setResult(null);setSelectedIds([]);setReviewConfirmed(false);setError("");if(fileRef.current)fileRef.current.value="";}} className="rounded-full px-3 py-2.5 text-xs text-white/35 hover:text-white/70">Reset</button>
            </div>
            {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
            <h2 className="font-['Manrope'] text-lg font-semibold">2. Validation summary</h2>
            {!result ? <div className="mt-8 rounded-xl border border-dashed border-white/10 px-5 py-10 text-center"><FileJson className="mx-auto text-white/20" size={25}/><p className="mt-3 text-sm text-white/50">No import reviewed yet</p><p className="mt-1 text-xs text-white/30">Add a JSON file and validate it to see the results.</p></div> : <>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[.045] p-3"><p className="text-2xl font-semibold tabular-nums">{result.titles.length}</p><p className="mt-1 text-[10px] text-white/40">Accepted</p></div>
                <div className="rounded-xl bg-white/[.045] p-3"><p className="text-2xl font-semibold tabular-nums">{result.rejected.length}</p><p className="mt-1 text-[10px] text-white/40">Rejected</p></div>
                <div className="rounded-xl bg-white/[.045] p-3"><p className="text-2xl font-semibold tabular-nums">{result.issues.length}</p><p className="mt-1 text-[10px] text-white/40">Warnings</p></div>
              </div>
              {result.rejected.length > 0 && <div className="mt-5 space-y-2"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-rose-300">Rejected records</p>{result.rejected.map((item, index) => <div key={`${item.index}-${index}`} className="flex gap-2 rounded-lg border border-rose-300/10 bg-rose-300/[.04] p-3"><XCircle size={14} className="mt-0.5 shrink-0 text-rose-300"/><div><p className="text-xs text-white/70">{item.index < 0 ? "Import file" : `Record ${item.index + 1}`}</p><p className="mt-1 text-[11px] leading-5 text-white/40">{item.reason}</p></div></div>)}</div>}
              {result.issues.length > 0 && <div className="mt-5 space-y-2"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-amber-200">Quality warnings</p>{result.issues.map((issue, index) => <div key={`${issue.code}-${issue.titleId}-${index}`} className="flex gap-2 rounded-lg border border-amber-200/10 bg-amber-200/[.035] p-3"><AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-200"/><div><p className="text-xs text-white/70">{issue.title} · {issue.code}</p><p className="mt-1 text-[11px] leading-5 text-white/40">{issue.message}</p></div></div>)}</div>}
              {result.titles.length > 0 && result.issues.length === 0 && result.rejected.length === 0 && <p className="mt-5 flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={15}/> All records passed validation.</p>}
            </>}
          </section>
        </div>

        {result && result.titles.length > 0 && <>
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] p-5 md:px-6"><div><h2 className="font-['Manrope'] text-lg font-semibold">3. Review accepted titles</h2><p className="mt-1 text-xs text-white/40">Uncheck anything you do not want in the approved export.</p></div><span className="text-xs tabular-nums text-[#d9b779]">{selectedTitles.length} / {result.titles.length} selected</span></div>
            <div className="divide-y divide-white/[.06]">
              {result.titles.map((title) => {
                const checked = selectedIds.includes(title.id);
                return <label key={title.id} className="flex cursor-pointer items-start gap-3 p-4 transition hover:bg-white/[.025] md:px-6">
                  <input type="checkbox" checked={checked} onChange={() => toggleTitle(title)} className="mt-1 accent-[#d9b779]"/>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-white/85">{title.title}</span><span className="rounded bg-white/[.06] px-2 py-0.5 text-[9px] text-white/40">ID {title.id}</span></div><p className="mt-1 text-[11px] text-white/40">{title.year} · {title.kind} · {title.genre} · {title.country}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/35">{title.description}</p></div>
                  <span className={checked ? "rounded-full bg-[#d9b779]/10 p-1.5 text-[#d9b779]" : "rounded-full bg-white/[.05] p-1.5 text-white/25"}>{checked ? <Check size={14}/> : <XCircle size={14}/>}</span>
                </label>;
              })}
            </div>
          </section>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
            <h2 className="font-['Manrope'] text-lg font-semibold">4. Approve and export</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/55"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} className="mt-1 accent-[#d9b779]"/><span>I have reviewed the selected titles and confirm this export is ready for a separate, reviewed catalogue update.</span></label>
            <button onClick={exportApproved} disabled={!reviewConfirmed || selectedTitles.length === 0} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-semibold text-[#17130d] transition hover:bg-[#e8c990] disabled:cursor-not-allowed disabled:opacity-40"><Download size={14}/> Export {selectedTitles.length} approved {selectedTitles.length === 1 ? "title" : "titles"}</button>
            <p className="mt-3 text-[11px] leading-5 text-white/30">This downloads a versioned JSON file. It does not publish, merge or replace Watchora's live catalogue. Publishing remains a separate Git-reviewed operation.</p>
          </section>
        </>}
        <p className="mt-10 text-center text-[10px] leading-5 text-white/25">Unlisted utility, not an authenticated admin console · Files are processed in your browser · Import only metadata and artwork you are licensed to use.</p>
      </section>
    </main>
  );
}
