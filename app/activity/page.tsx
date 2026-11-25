import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ArrowRight, Clock3, EyeOff, Star, ThumbsUp } from "lucide-react";

export const dynamic = "force-dynamic";

type ActivityItem = {
  review_id: string;
  title_id: number;
  member_id: string;
  display_name: string;
  rating: number;
  review_body: string | null;
  contains_spoilers: boolean;
  helpful_votes: number;
  created_at: string;
};

const catalogue = getCatalogueProvider();

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function ActivityPage() {
  let activity: ActivityItem[] = [];
  let connected = isSupabaseConfigured();
  if (connected) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_community_activity", { p_limit: 30 });
    if (error) connected = false;
    else activity = (data ?? []) as ActivityItem[];
  }

  const items = activity.flatMap((item) => {
    const title = catalogue.getById(Number(item.title_id));
    return title ? [{ ...item, title }] : [];
  });

  return <main className="min-h-screen">
    <SiteHeader />
    <section className="shell max-w-5xl py-12 md:py-16">
      <Link href="/community" className="text-xs text-white/40 transition hover:text-white">← Community</Link>
      <p className="eyebrow mt-8">A living film conversation</p>
      <h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">Community activity.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">Recent approved reviews from Watchora members. Helpful votes recognise thoughtful contributions; spoiler-marked review text stays hidden here.</p>
      {!connected ? <div className="mt-10 rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.04] p-7 text-sm leading-6 text-white/55">The activity feed will appear once the Supabase review service is configured and the community activity migration has been applied.</div>
      : items.length ? <div className="mt-10 space-y-4">{items.map((item) => <article key={item.review_id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/members/${item.member_id}`} className="text-sm font-semibold text-white/85 transition hover:text-[#d9b779]">{item.display_name}</Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/35"><Clock3 size={12}/>{formatDate(item.created_at)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/title/${item.title.id}`} className="font-['Manrope'] text-xl font-semibold tracking-[-.03em] transition hover:text-[#d9b779]">{item.title.title}</Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9b779]/20 bg-[#d9b779]/[.06] px-3 py-1.5 text-xs text-[#e5c78f]"><Star size={12} fill="currentColor"/>{item.rating}/5 member rating</span>
        </div>
        {item.contains_spoilers ? <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/45"><EyeOff size={14}/> Spoiler-marked review — its text is hidden in the activity feed.</div>
        : item.review_body ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{item.review_body}</p> : null}
        <div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4 text-[11px] text-white/35"><span>{item.title.year} · {item.title.genre} · {item.title.country}</span><span className="inline-flex items-center gap-1.5"><ThumbsUp size={12}/>{Number(item.helpful_votes) || 0} helpful</span></div>
      </article>)}</div>
      : <div className="mt-10 rounded-2xl border border-white/10 p-10 text-center"><p className="text-sm text-white/55">No published reviews yet.</p><p className="mt-2 text-xs text-white/35">When members share approved reviews, they’ll appear here.</p><Link href="/#discover" className="mt-5 inline-flex items-center gap-2 text-xs text-[#d9b779]">Explore the catalogue <ArrowRight size={13}/></Link></div>}
    </section>
  </main>;
}
