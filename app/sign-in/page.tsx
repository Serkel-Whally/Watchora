"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(new URLSearchParams(window.location.search).get("next") || "/")}` },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send a sign-in link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft size={14}/> Back to Watchora</Link>
        <div className="mt-9 rounded-3xl border border-white/10 bg-[#101216] p-7 sm:p-9">
          <Link href="/" className="font-['Manrope'] text-xl font-extrabold tracking-[-.06em]">watchora<span className="text-[#d9b779]">.</span></Link>
          {sent ? (
            <div className="mt-9">
              <CheckCircle2 size={30} className="text-[#d9b779]"/>
              <h1 className="mt-5 font-['Manrope'] text-2xl font-semibold">Check your inbox</h1>
              <p className="mt-3 text-sm leading-7 text-white/50">We sent a secure sign-in link to <span className="text-white">{email}</span>. Open it on this device to continue to Watchora.</p>
            </div>
          ) : (
            <>
              <p className="eyebrow mt-9">Your Watchora account</p>
              <h1 className="mt-3 font-['Manrope'] text-3xl font-semibold tracking-[-.05em]">Sign in to join the conversation</h1>
              <p className="mt-3 text-sm leading-7 text-white/45">Use your email to receive a secure, password-free sign-in link. Use your account to publish reviews and keep your watchlist synced across devices.</p>
              <form onSubmit={submit} className="mt-8">
                <label htmlFor="signin-email" className="text-xs font-medium text-white/65">Email address</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 focus-within:border-[#d9b779]/50">
                  <Mail size={16} className="text-white/35"/>
                  <input id="signin-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"/>
                </div>
                {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
                <button type="submit" disabled={busy} className="mt-5 w-full rounded-full bg-[#d9b779] px-5 py-3.5 text-sm font-semibold text-[#17130c] transition hover:bg-[#edce94] disabled:opacity-50">{busy ? "Sending link…" : "Email me a sign-in link"}</button>
              </form>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-white/30">By signing in, you agree to keep Watchora respectful. Reviews are checked before public display.</p>
      </div>
    </main>
  );
}
