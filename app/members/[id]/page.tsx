import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCatalogueProvider } from "@/lib/sample-catalogue-provider";
import { ArrowLeft, Star, UserRound } from "lucide-react";
import FollowMemberButton from "@/components/follow-member-button";

export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !isSupabaseConfigured()) notFound();
  const supabase = await createSupabaseServerClient();
  const [{ data: { user } }, { data: profile }, { data: reviews }, { data: reputation }, { data: followStats }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("id, display_name, bio, created_at").eq("id", id).maybeSingle(),
    supabase.from("title_reviews").select("id, title_id, rating, body, contains_spoilers, created_at").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false }).limit(50),
    supabase.rpc("get_member_reputation", { p_member_id: id }),
    supabase.rpc("get_member_follow_stats", { p_member_id: id }),
  ]);
  if (!profile) notFound();
  const catalogue = getCatalogueProvider();
  const entries = (reviews ?? []).map((review) => ({ review, title: catalogue.getById(Number(review.title_id)) })).filter((entry) => entry.title);
  return <main className="min-h-screen"><SiteHeader/><section className="shell max-w-4xl py-12 md:py-16">
    <Link href="/explore" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft size={14}/> Back to discovery</Link>
    <div className="mt-9 rounded-3xl border border-white/10 bg-[#101216] p-7 sm:p-9">
      <div className="flex items-start gap-5"><div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[#d9b779]/25 bg-[#d9b779]/10 text-[#d9b779]"><UserRound size={27}/></div><div className="min-w-0"><p className="eyebrow">Watchora member</p><h1 className="mt-2 break-words font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">{profile.display_name}</h1><p className="mt-2 text-xs text-white/35">Member since {new Date(profile.created_at).toLocaleDateString("en", { month: "long", year: "numeric" })}</p></div></div>
      {profile.bio && <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/60">{profile.bio}</p>}
      {user?.id !== id && <FollowMemberButton memberId={id} signedIn={Boolean(user)} initialFollowing={Boolean(followStats?.[0]?.viewer_follows)} initialFollowers={Number(followStats?.[0]?.followers_count) || 0} initialFollowingCount={Number(followStats?.[0]?.following_count) || 0} />}
      {user?.id === id && <p className="mt-5 text-xs text-white/35">This is how other members see your public profile.</p>}
      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-5"><div><p className="text-2xl font-semibold tabular-nums text-white">{Number(reputation?.approved_reviews) || entries.length}</p><p className="mt-1 text-[11px] text-white/40">Published reviews</p></div><div><p className="text-2xl font-semibold tabular-nums text-[#d9b779]">{Number(reputation?.helpful_votes) || 0}</p><p className="mt-1 text-[11px] text-white/40">Helpful votes received</p></div></div>
    </div>
    <div className="mt-10"><p className="eyebrow">Their perspective</p><h2 className="mt-2 font-['Manrope'] text-2xl font-semibold">Published reviews</h2>
      {entries.length ? <div className="mt-6 space-y-4">{entries.map(({review,title}) => <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/title/${title!.id}`} className="font-semibold text-white/85 hover:text-[#d9b779]">{title!.title}</Link><span className="inline-flex items-center gap-1 text-xs text-[#d9b779]"><Star size={13} fill="currentColor"/> {review.rating}/5</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/60">{review.contains_spoilers ? "This member marked their review as containing spoilers. Open the title page to reveal it safely." : review.body}</p><p className="mt-4 text-[11px] text-white/30">{new Date(review.created_at).toLocaleDateString()}</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center text-sm text-white/40">No published reviews yet.</div>}
    </div>
  </section></main>;
}
