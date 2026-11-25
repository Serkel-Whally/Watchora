import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { ArrowRight, EyeOff, Star, ThumbsUp, Users } from "lucide-react";

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

export default async function FollowingPage() {
  if (!isSupabaseConfigured()) return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-4xl py-16"><p className="eyebrow">Your community</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold">Following feed.</h1><p className="mt-4 text-sm text-white/45">Connect Watchora to Supabase to follow members and build a personal activity feed.</p></section></main>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-4xl py-16"><p className="eyebrow">Your community</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold">Following feed.</h1><p className="mt-4 text-sm text-white/45">Sign in to see recent reviews from the members you follow.</p><Link href="/sign-in?next=%2Ffollowing" className="mt-6 inline-flex rounded-full bg-[#d9b779] px-5 py-3 text-xs font-bold text-[#17130d]">Sign in</Link></section></main>;
  const [{ data: activity }, { data: following }] = await Promise.all([
    supabase.rpc("get_following_activity", { p_limit: 50 }),
    supabase.from("member_follows").select("following_id").eq("follower_id", user.id).limit(100),
  ]);
  const catalogue = getCatalogueProvider();
  const items = ((activity ?? []) as ActivityItem[]).flatMap((item) => {
    const title = catalogue.getById(Number(item.title_id));
    return title ? [{ ...item, title }] : [];
  });
  const followingCount = following?.length ?? 0;
  return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-5xl py-12 md:py-16">
    <p className="eyebrow">Your community</p><h1 className="mt-3 font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">Following feed.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">A quieter corner of Watchora, filled with approved reviews from the members you choose to follow.</p>
    <div className="mt-7 flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-2 text-xs text-white/45"><Users size={14} className="text-[#d9b779]"/>{followingCount} members followed</span><Link href="/community" className="text-xs text-[#d9b779] hover:text-[#edce94]">Discover members <ArrowRight size={12} className="ml-1 inline"/></Link><Link href="/activity" className="text-xs text-white/45 hover:text-white">All community activity</Link></div>
    {items.length ? <div className="mt-10 space-y-4">{items.map((item) => <article key={item.review_id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-7">
      <Link href={`/members/${item.member_id}`} className="text-sm font-semibold text-white/85 hover:text-[#d9b779]">{item.display_name}</Link><p className="mt-1 text-[11px] text-white/35">{new Date(item.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Link href={`/title/${item.title.id}`} className="font-['Manrope'] text-xl font-semibold hover:text-[#d9b779]">{item.title.title}</Link><span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9b779]/20 bg-[#d9b779]/[.06] px-3 py-1.5 text-xs text-[#e5c78f]"><Star size={12} fill="currentColor"/>{item.rating}/5</span></div>
      {item.contains_spoilers ? <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/45"><EyeOff size={14}/> Spoiler-marked review — text is hidden in this feed.</div> : item.review_body && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{item.review_body}</p>}
      <div className="mt-5 flex items-center justify-between border-t border-white/[.07] pt-4 text-[11px] text-white/35"><span>{item.title.year} · {item.title.genre} · {item.title.country}</span><span className="inline-flex items-center gap-1.5"><ThumbsUp size={12}/>{Number(item.helpful_votes)||0} helpful</span></div>
    </article>)}</div> : <div className="mt-10 rounded-2xl border border-white/10 p-10 text-center"><Users size={25} className="mx-auto text-[#d9b779]"/><h2 className="mt-4 font-['Manrope'] text-xl font-semibold">Your feed starts with a follow.</h2><p className="mt-2 text-sm text-white/40">Visit the community directory and follow members whose film perspectives you enjoy.</p><Link href="/community" className="mt-5 inline-flex items-center gap-2 text-xs text-[#d9b779]">Discover members <ArrowRight size={13}/></Link></div>}
  </section></main>;
}
