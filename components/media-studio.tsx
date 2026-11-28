"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import Link from "next/link";
import { ArrowLeft, Film, Plus, RefreshCw, ShieldCheck, Tv2, Video } from "lucide-react";
import { films } from "@/lib/catalogue";

type RightsWindow = { id: string; territory_code: string; starts_at: string; ends_at: string | null; status: string };
type MediaTitle = { id: number; studioId?: number; title: string; year: number; kind: string };
type Asset = { id: string; title_id: number; provider: string; provider_asset_id: string; status: string; created_at: string; updated_at: string; rights_windows?: RightsWindow[] };
const STUDIO_PUBLIC_ID_OFFSET = 1_000_000_000;

const statuses = ["pending", "processing", "ready", "failed", "disabled"] as const;

export default function MediaStudio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [titles, setTitles] = useState<MediaTitle[]>(films);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [titleId, setTitleId] = useState(String(films[0]?.id ?? ""));
  const [provider, setProvider] = useState("cloudflare-stream");
  const [providerAssetId, setProviderAssetId] = useState("");
  const [status, setStatus] = useState("pending");
  const [query, setQuery] = useState("");
  const [rightsAssetId, setRightsAssetId] = useState("");
  const [territoryCode, setTerritoryCode] = useState("WORLD");
  const [rightsStart, setRightsStart] = useState("");
  const [rightsEnd, setRightsEnd] = useState("");
  const [savingRights, setSavingRights] = useState(false);
  const [busyRightsId, setBusyRightsId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState("10800");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const uploadRef = useRef<tus.Upload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleMap = useMemo(() => new Map(titles.map((title) => [title.id, title])), [titles]);
  const filteredAssets = assets.filter((asset) => {
    const title = titleMap.get(asset.title_id)?.title ?? "";
    return `${title} ${asset.provider} ${asset.provider_asset_id} ${asset.status}`.toLowerCase().includes(query.toLowerCase());
  });
  const readyCount = assets.filter((asset) => asset.status === "ready").length;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [response, catalogueResponse] = await Promise.all([
        fetch("/api/admin/media-assets", { cache: "no-store" }),
        fetch("/api/admin/catalogue", { cache: "no-store" }),
      ]);
      const result = await response.json();
      const catalogueResult = await catalogueResponse.json().catch(() => ({}));
      if (response.status === 401) { window.location.href = "/sign-in?next=%2Fadmin%2Fmedia"; return; }
      if (!response.ok) throw new Error(result.error || "Unable to load media inventory.");
      setAssets(Array.isArray(result.assets) ? result.assets : []);
      if (catalogueResponse.ok && Array.isArray(catalogueResult.titles)) {
        const studioTitles = catalogueResult.titles.map((title: { id: number; title: string; release_year: number | null; kind: string }) => ({
          id: STUDIO_PUBLIC_ID_OFFSET + title.id, studioId: title.id,
          title: title.title, year: title.release_year ?? 0, kind: title.kind,
        }));
        setTitles([...studioTitles, ...films]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load media inventory.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function startDirectUpload() {
    if (!selectedFile || uploading) return;
    if (selectedFile.size <= 0 || selectedFile.size >= 30 * 1024 * 1024 * 1024) {
      setError("Choose a video file no larger than 30 GB.");
      return;
    }
    const duration = Number(maxDurationSeconds);
    if (!Number.isSafeInteger(duration) || duration < 1 || duration > 36000) {
      setError("Maximum duration must be between 1 second and 10 hours.");
      return;
    }

    setError(""); setNotice(""); setUploadProgress(0); setUploading(true);
    setUploadStatus("Preparing a secure upload...");
    let uploadedMediaId = "";
    const params = new URLSearchParams({
      titleId,
      maxDurationSeconds: String(duration),
      fileName: selectedFile.name,
    });
    const upload = new tus.Upload(selectedFile, {
      endpoint: `/api/admin/cloudflare-upload-url?${params.toString()}`,
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { filename: selectedFile.name, filetype: selectedFile.type || "application/octet-stream" },
      onAfterResponse: (_request, response) => {
        const mediaId = response.getHeader("stream-media-id");
        if (mediaId) uploadedMediaId = mediaId;
      },
      onProgress: (uploadedBytes, totalBytes) => {
        const percentage = totalBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)) : 0;
        setUploadProgress(percentage);
        setUploadStatus(`Uploading video... ${percentage}%`);
      },
      onError: (cause) => {
        setError(cause.message || "The video upload failed.");
        setUploadStatus("Upload failed.");
        setUploading(false);
        uploadRef.current = null;
      },
      onSuccess: async () => {
        setUploadProgress(100);
        setUploadStatus("Upload complete. Registering the media asset...");
        if (!uploadedMediaId) {
          setError("The upload completed, but Cloudflare did not return a media ID. Check Cloudflare Stream before retrying.");
          setUploading(false);
          uploadRef.current = null;
          return;
        }
        try {
          const response = await fetch("/api/admin/media-assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titleId: Number(titleId),
              provider: "cloudflare-stream",
              providerAssetId: uploadedMediaId,
              status: "processing",
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "The video uploaded, but its media record could not be saved.");
          setNotice("Video uploaded to Cloudflare Stream and registered. It will become playable after processing finishes and an approved rights window is active.");
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setUploadStatus("Upload complete — processing in Cloudflare Stream.");
          await load();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : `Upload complete. Register Cloudflare asset ID: ${uploadedMediaId}`);
          setUploadStatus(`Upload complete — asset ID: ${uploadedMediaId}`);
        } finally {
          setUploading(false);
          uploadRef.current = null;
        }
      },
    });
    uploadRef.current = upload;
    upload.start();
  }

  async function cancelDirectUpload() {
    if (!uploadRef.current) return;
    await uploadRef.current.abort(true);
    uploadRef.current = null;
    setUploading(false);
    setUploadStatus("Upload cancelled.");
  }

  async function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/media-assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: Number(titleId), provider, providerAssetId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to register media asset.");
      setAssets((current) => [result.asset, ...current]);
      setProviderAssetId("");
      setNotice("Asset registered. Playback also requires Cloudflare readiness, signed-URL privacy and an active territory rights window.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to register media asset."); }
    finally { setSaving(false); }
  }

  async function addRightsWindow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingRights(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/rights-windows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaAssetId: rightsAssetId, territoryCode, startsAt: new Date(rightsStart).toISOString(), endsAt: rightsEnd ? new Date(rightsEnd).toISOString() : null }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create rights window.");
      setAssets((current) => current.map((asset) => asset.id === rightsAssetId ? { ...asset, rights_windows: [...(asset.rights_windows ?? []), result.rightsWindow] } : asset));
      setNotice("Rights window saved as draft. Activate it only after legal approval."); setRightsEnd("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create rights window."); }
    finally { setSavingRights(false); }
  }

  async function updateRightsStatus(id: string, nextStatus: string) {
    setBusyRightsId(id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/rights-windows", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update rights status.");
      setAssets((current) => current.map((asset) => ({
        ...asset,
        rights_windows: (asset.rights_windows ?? []).map((window) => window.id === id ? { ...window, status: result.rightsWindow.status } : window),
      })));
      setNotice("Rights status updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update rights status."); }
    finally { setBusyRightsId(""); }
  }

  async function updateStatus(id: string, nextStatus: string) {
    setBusyId(id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/media-assets", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update asset.");
      setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, status: result.asset.status, updated_at: new Date().toISOString() } : asset));
      setNotice("Media status updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update asset."); }
    finally { setBusyId(""); }
  }

  return (
    <main className="min-h-screen bg-[#090b0e] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to Watchora</Link>
        <div className="mt-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Watchora operations</p><h1 className="mt-2 font-['Manrope'] text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Media studio</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">Register provider assets, track processing status and review distribution-rights coverage for catalogue titles.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#d9b779]/20 bg-[#d9b779]/[.05] px-4 py-2 text-xs text-[#d9b779]"><ShieldCheck size={14}/> Admin workspace</div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Registered assets</p><p className="mt-2 font-['Manrope'] text-3xl font-semibold tabular-nums">{assets.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Marked ready</p><p className="mt-2 font-['Manrope'] text-3xl font-semibold tabular-nums">{readyCount}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs text-white/40">Catalogue titles</p><p className="mt-2 font-['Manrope'] text-3xl font-semibold tabular-nums">{titles.length}</p></div>
        </div>

        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-sm text-emerald-200">{notice}</p>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[.05] p-4 text-sm text-red-200">{error}<button onClick={() => void load()} className="ml-3 underline underline-offset-4">Retry</button></div>}

        <section className="mt-8 rounded-2xl border border-[#d9b779]/20 bg-[#101216] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#d9b779]">Direct ingest</p><h2 className="mt-2 font-['Manrope'] text-xl font-semibold">Upload a video to Watchora</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-white/45">Videos upload directly from your browser to Cloudflare using resumable transfer. Your file does not pass through the Watchora application server, and the upload is created as private.</p></div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/45">Up to 30 GB</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <label className="block text-xs text-white/55">Catalogue title
              <select value={titleId} onChange={(event) => setTitleId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none focus:border-[#d9b779]/60">{titles.map((film) => <option key={film.id} value={film.id}>{film.title} ({film.year || "Year TBA"}) · {film.kind}</option>)}</select>
            </label>
            <label className="block text-xs text-white/55">Video file
              <input ref={fileInputRef} type="file" accept="video/*,.mkv,.avi,.mov,.mp4,.webm" disabled={uploading} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-xs text-white/65 file:mr-3 file:rounded-full file:border-0 file:bg-[#d9b779] file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-[#17130d]"/>
            </label>
            <label className="block text-xs text-white/55">Maximum duration (seconds)
              <input type="number" min="1" max="36000" value={maxDurationSeconds} disabled={uploading} onChange={(event) => setMaxDurationSeconds(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none focus:border-[#d9b779]/60"/>
            </label>
          </div>
          {selectedFile && <p className="mt-3 break-all text-[11px] text-white/40">{selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={startDirectUpload} disabled={!selectedFile || uploading || titles.length === 0} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94] disabled:opacity-45"><Video size={14}/>{uploading ? "Uploading..." : "Start secure upload"}</button>
            {uploading && <button type="button" onClick={() => void cancelDirectUpload()} className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/60 hover:text-white">Cancel upload</button>}
            {uploadStatus && <span role="status" className="text-xs text-white/50">{uploadStatus}</span>}
          </div>
          {(uploading || uploadProgress > 0) && <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d9b779] transition-[width]" style={{ width: `${uploadProgress}%` }}/></div>}
          <p className="mt-4 text-[10px] leading-5 text-white/30">Cloudflare requires a maximum duration reservation for each upload. The default is 3 hours; set it above the video's actual runtime. Uploads can be resumed after network interruptions. Only upload content Watchora is licensed to distribute.</p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
          <form onSubmit={addAsset} className="rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9b779]/10 text-[#d9b779]"><Plus size={18}/></div><div><h2 className="font-['Manrope'] text-lg font-semibold">Register media asset</h2><p className="mt-1 text-xs text-white/40">Store a provider reference, never a public source URL.</p></div></div>
            <label className="mt-6 block text-xs text-white/55">Catalogue title</label>
            <select value={titleId} onChange={(event) => setTitleId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none focus:border-[#d9b779]/60">
              {titles.map((film) => <option key={film.id} value={film.id}>{film.title} ({film.year || "Year TBA"}) · {film.kind}</option>)}
            </select>
            <label className="mt-4 block text-xs text-white/55">Video provider</label>
            <input required minLength={2} maxLength={80} value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="cloudflare-stream" className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d9b779]/60"/>
            <label className="mt-4 block text-xs text-white/55">Provider asset ID</label>
            <input required minLength={2} maxLength={200} value={providerAssetId} onChange={(event) => setProviderAssetId(event.target.value)} placeholder="Provider's asset identifier" className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d9b779]/60"/>
            <label className="mt-4 block text-xs text-white/55">Processing status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-sm text-white outline-none focus:border-[#d9b779]/60">
              {statuses.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
            </select>
            <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d] transition hover:bg-[#edce94] disabled:opacity-50"><Plus size={14}/>{saving ? "Registering…" : "Register asset"}</button>
          </form>

          <aside className="rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.05] text-white/60"><ShieldCheck size={18}/></div><div><h2 className="font-['Manrope'] text-lg font-semibold">Distribution checklist</h2><p className="mt-1 text-xs text-white/40">Required before enabling playback.</p></div></div>
            <ul className="mt-5 space-y-4 text-sm text-white/65">
              <li className="flex gap-3"><Film size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/> Confirm written distribution rights for the title.</li>
              <li className="flex gap-3"><Tv2 size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/> Record permitted territories and start/end dates.</li>
              <li className="flex gap-3"><Video size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/> Verify provider ingest, encoding and playback status.</li>
              <li className="flex gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#d9b779]"/> Confirm whether the licence requires DRM; DRM support is not enabled yet.</li>
            </ul>
            <p className="mt-6 rounded-xl border border-[#d9b779]/15 bg-[#d9b779]/[.04] p-4 text-xs leading-6 text-[#d9b779]/80">A “ready” label is an editorial status only. It does not grant rights or create a playable session.</p>
          </aside>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5 sm:p-6">
          <h2 className="font-['Manrope'] text-lg font-semibold">Distribution rights window</h2>
          <p className="mt-1 text-xs text-white/40">Create a territory and time-bound rights record. New records start as drafts.</p>
          <form onSubmit={addRightsWindow} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select required value={rightsAssetId} onChange={(event) => setRightsAssetId(event.target.value)} className="rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-xs text-white"><option value="">Choose asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{titleMap.get(asset.title_id)?.title || ("Title #" + asset.title_id)} · {asset.provider}</option>)}</select>
            <input required value={territoryCode} onChange={(event) => setTerritoryCode(event.target.value.toUpperCase())} maxLength={5} placeholder="WORLD or GH" className="rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-xs text-white"/>
            <input required type="datetime-local" value={rightsStart} onChange={(event) => setRightsStart(event.target.value)} className="rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-xs text-white"/>
            <input type="datetime-local" value={rightsEnd} onChange={(event) => setRightsEnd(event.target.value)} className="rounded-xl border border-white/10 bg-[#090b0e] px-3 py-3 text-xs text-white"/>
            <button disabled={savingRights || assets.length === 0} className="rounded-full bg-[#d9b779] px-4 py-3 text-xs font-bold text-[#17130d] disabled:opacity-50">{savingRights ? "Saving…" : "Add draft window"}</button>
          </form>
          <p className="mt-3 text-[10px] text-white/30">Territory accepts WORLD or an ISO two-letter country code. Leave end date empty for an open-ended agreement.</p>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-['Manrope'] text-xl font-semibold">Media inventory</h2><p className="mt-1 text-xs text-white/40">Provider references linked to published Studio titles and the starter catalogue.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"><RefreshCw size={13}/> Refresh</button></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, provider, asset ID or status…" className="mt-4 w-full rounded-xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d9b779]/60"/>
          {loading ? <p className="py-12 text-center text-sm text-white/40">Loading media inventory…</p> : filteredAssets.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center"><Video size={26} className="mx-auto text-white/25"/><p className="mt-4 text-sm font-medium text-white/65">{assets.length ? "No matching assets" : "No media assets registered yet"}</p><p className="mt-1 text-xs text-white/35">Register a provider asset above to start building your inventory.</p></div> : (
            <div className="mt-4 space-y-3">
              {filteredAssets.map((asset) => {
                const title = titleMap.get(asset.title_id);
                return <article key={asset.id} className="rounded-2xl border border-white/10 bg-[#101216] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="text-sm font-semibold text-white">{title?.title ?? `Catalogue title #${asset.title_id}`}</p><p className="mt-1 break-all text-xs text-white/40">{asset.provider} · {asset.provider_asset_id}</p><p className="mt-2 text-[10px] text-white/30">Added {new Date(asset.created_at).toLocaleDateString()}</p></div>
                    <div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${asset.status === "ready" ? "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200" : asset.status === "failed" ? "border-red-400/20 bg-red-400/[.06] text-red-200" : "border-white/10 bg-white/[.03] text-white/50"}`}>{asset.status}</span><select disabled={busyId === asset.id} value={asset.status} onChange={(event) => void updateStatus(asset.id, event.target.value)} aria-label={`Update status for ${title?.title ?? asset.id}`} className="max-w-32 rounded-lg border border-white/10 bg-[#090b0e] px-2 py-2 text-xs text-white outline-none disabled:opacity-40">{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                  </div>
                  <div className="mt-4 border-t border-white/[.07] pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.13em] text-white/35">Distribution rights</p>
                    {asset.rights_windows?.length ? <div className="space-y-2">{asset.rights_windows.map((window) => <div key={window.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/45"><span>{window.territory_code} · {new Date(window.starts_at).toLocaleDateString()}{window.ends_at ? ` – ${new Date(window.ends_at).toLocaleDateString()}` : " – no end date"}</span><select disabled={busyRightsId === window.id} value={window.status} onChange={(event) => void updateRightsStatus(window.id, event.target.value)} aria-label={`Update rights status for ${window.territory_code}`} className="rounded-lg border border-white/10 bg-[#090b0e] px-2 py-1.5 text-[10px] text-white/65 disabled:opacity-40"><option value="draft">Draft</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="expired">Expired</option></select></div>)}</div> : <p className="text-xs text-white/35">No distribution-rights windows recorded.</p>}
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
        <p className="mt-10 text-center text-[10px] leading-6 text-white/25">Private admin tool · provider secrets and media delivery URLs are never displayed here.</p>
      </div>
    </main>
  );
}
