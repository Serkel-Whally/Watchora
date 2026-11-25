import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ArrowRight, Medal, Star, ThumbsUp, Users } from "lucide-react";

export const dynamic = "force-dynamic";

type CommunityMember = { member_id: string; display_name: string; bio: string; approved_reviews: number; helpful_votes: number };

export default async function CommunityPage() {
  let members: CommunityMember[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc("get_community_members", { p_limit: 30 });
    members = (data ?? []) as CommunityMember[];
  }
  return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-5xl py-12 md:py-16">
    <p className="eyebrow">The people behind the perspectives</p>
    <h1 className="mt-3 max-w-3xl font-['Manrope'] text-4xl font-semibold tracking-[-.06em] md:text-6xl">Meet the Watchora community.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">Discover members sharing thoughtful reviews from around the world. Reputation grows through approved reviews and helpful votes from other members.</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><Users className="text-[#d9b779]" size={19}/><p className="mt-4 text-sm font-semibold">Real members</p><p className="mt-1 text-xs text-white/40">Profiles backed by verified accounts.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><Star className="text-[#d9b779]" size={19}/><p className="mt-4 text-sm font-semibold">Published reviews</p><p className="mt-1 text-xs text-white/40">Only moderator-approved reviews count.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><ThumbsUp className="text-[#d9b779]" size={19}/><p className="mt-4 text-sm font-semibold">Helpful votes</p><p className="mt-1 text-xs text-white/40">Recognition from other members.</p></div>
    </div>
    <div className="mt-12 flex items-end justify-between gap-4"><div><p className="eyebrow">Community voices</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold">Top contributors</h2></div><span className="text-xs text-white/35">Ranked by helpful votes</span></div>
    {!isSupabaseConfigured() ? <div className="mt-6 rounded-2xl border border-[#d9b779]/20 bg-[#d9b779]/[.04] p-7 text-sm text-white/55">The community directory will appear when Watchora’s review service is connected.</div> : members.length ? <div className="mt-6 space-y-3">{members.map((member,index)=><Link key={member.member_id} href={`/members/${member.member_id}`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-[#d9b779]/30 hover:bg-white/[.045]"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm font-semibold tabular-nums text-white/50">{index===0?<Medal size={18} className="text-[#d9b779]"/>:String(index+1).padStart(2,"0")}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-white/85 group-hover:text-[#d9b779]">{member.display_name}</p><p className="mt-1 truncate text-xs text-white/40">{member.bio || "Watchora community member"}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-semibold tabular-nums text-[#d9b779]">{Number(member.helpful_votes)||0}</p><p className="text-[10px] text-white/35">helpful votes</p></div><div className="hidden text-right sm:block"><p className="text-sm font-semibold tabular-nums text-white/75">{Number(member.approved_reviews)||0}</p><p className="text-[10px] text-white/35">reviews</p></div><ArrowRight size={16} className="shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-[#d9b779]"/></Link>)}</div> : <div className="mt-6 rounded-2xl border border-white/10 p-9 text-center"><p className="text-sm text-white/55">No published member reviews yet.</p><p className="mt-2 text-xs text-white/35">Once members publish reviews, the community directory will grow here.</p></div>}
    <div className="mt-10"><Link href="/explore" className="inline-flex items-center gap-2 text-xs font-semibold text-[#d9b779] hover:text-[#edce94]">Discover films and series <ArrowRight size={14}/></Link></div>
  </section></main>;
}
