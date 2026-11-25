"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

const links = [
  { href: "/#discover", label: "Discover" },
  { href: "/collections", label: "Collections" },
  { href: "/community", label: "Community" },
  { href: "/activity", label: "Activity" },
  { href: "/following", label: "Following" },
  { href: "/preferences", label: "Preferences" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/profile", label: "My profile" },
  { href: "/notifications", label: "Notifications" },
];

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setUnreadNotifications(Number(data.unreadCount) || 0);
      } catch { /* Navigation remains usable if notifications are offline. */ }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
    <header className={`${overlay ? "absolute left-0 right-0 top-0 z-50 bg-black/20 backdrop-blur-md" : "relative z-30"} border-b border-white/[.08]`}>
      <div className="shell flex h-[76px] items-center justify-between">
        <Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link>
        <nav className="hidden items-center gap-7 text-xs text-white/60 md:flex" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className="relative inline-flex items-center gap-1.5 transition hover:text-white">{link.label}{link.href === "/notifications" && unreadNotifications > 0 && <span aria-label={`${unreadNotifications} unread notifications`} className="inline-flex min-w-4 items-center justify-center rounded-full bg-[#d9b779] px-1 py-0.5 text-[9px] font-bold leading-none text-[#17130d]">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}</Link>)}
        </nav>
        <button className="relative z-10 rounded-full border border-white/10 p-2.5 text-white transition hover:border-white/25 md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="watchora-site-mobile-menu">
          {open ? <X size={19}/> : <Menu size={19}/>}
        </button>
      </div>
    </header>
      <div className={`fixed inset-0 z-[70] overflow-hidden md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
        <button tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} aria-label="Close navigation menu" className={`absolute inset-0 bg-black/75 transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}/>
        <aside id="watchora-site-mobile-menu" aria-label="Mobile navigation" className={`absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col border-l border-white/10 bg-[#0b0c0f] px-7 pb-10 pt-7 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-7">
            <Link href="/" onClick={() => setOpen(false)} className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-full border border-white/10 p-2 text-white/70"><X size={18}/></button>
          </div>
          <nav className="mt-8 flex flex-col items-stretch gap-1 text-[15px] text-white/75" aria-label="Mobile navigation links">
            {links.map((link, index) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-4 transition hover:bg-white/[.06] hover:text-white"><span className="flex items-center gap-4"><span className="text-[10px] tabular-nums text-white/25">0{index + 1}</span>{link.label}{link.href === "/notifications" && unreadNotifications > 0 && <span className="rounded-full bg-[#d9b779] px-2 py-0.5 text-[9px] font-bold text-[#17130d]">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}</span><ArrowRight size={15} className="text-white/25"/></Link>)}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9b779]">A world of stories awaits</p>
            <p className="mt-2 text-xs leading-5 text-white/40">Discover something worth watching, from every corner of the world.</p>
            <Link href="/#discover" onClick={() => setOpen(false)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d9b779]">Explore titles <ArrowRight size={14}/></Link>
          </div>
        </aside>
      </div>
    </>
  );
}
