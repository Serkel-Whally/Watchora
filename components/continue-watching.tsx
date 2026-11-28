"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";

type ProgressRecord = { titleId: number; position: number; duration: number; updatedAt: number };
const STORAGE_KEY = "watchora-viewing-progress";
const catalogue = getCatalogueProvider();

export default function ContinueWatching() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(value)) setRecords(value.filter((item): item is ProgressRecord =>
        item && Number.isSafeInteger(item.titleId) && Number.isFinite(item.position) &&
        Number.isFinite(item.duration) && Number.isFinite(item.updatedAt) && item.position > 0 && item.duration > item.position
      ).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12));
    } catch { setRecords([]); }
  }, []);
  const titles = records.map((record) => ({ record, title: catalogue.getById(record.titleId) })).filter((item) => item.title);
  if (!titles.length) return null;
  return (
    <section className="shell pt-12 md:pt-16">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Pick up where you left off</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold tracking-tight md:text-3xl">Continue watching</h2></div><span className="text-[10px] text-white/35">Saved on this device</span></div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {titles.map(({ record, title }) => title && <Link key={record.titleId} href={`/watch/${record.titleId}`} className="group w-[250px] shrink-0 snap-start sm:w-[300px]">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[#17191e]"><img src={title.image} alt="" className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"/><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9b779] text-[#17130d]"><Play size={16} fill="currentColor"/></span></span><span className="absolute bottom-0 left-0 h-1 bg-white/20" style={{width:"100%"}}><span className="block h-full bg-[#d9b779]" style={{width:`${Math.min(100, (record.position / record.duration) * 100)}%`}}/></span></div>
          <div className="mt-3 flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-white">{title.title}</span><span className="shrink-0 text-[10px] tabular-nums text-white/40">{Math.round((record.position / record.duration) * 100)}%</span></div>
        </Link>)}
      </div>
      <div className="mt-2 flex justify-end"><Link href="/watchlist" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#d9b779] hover:text-[#edce94]">Open My List <ArrowRight size={12}/></Link></div>
    </section>
  );
}
