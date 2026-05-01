"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const FREE_FEATURES = [
  {
    title: "Script Analysis",
    blurb:
      "Upload a PDF or text script. We parse it into characters, scenes, and lines automatically.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    ),
  },
  {
    title: "Line Memory Tracker",
    blurb:
      "Hide and reveal your lines, mark which ones are clean and which still trip you up.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: "Bookmarks",
    blurb:
      "Mark beats and moments in a script so you can jump back to them on the next pass.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    ),
  },
  {
    title: "Teleprompter",
    blurb:
      "Scrolling teleprompter view at your pace — perfect for drilling lines without taking your eyes off the screen.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
      />
    ),
  },
];

const FREE_LIMITS = [
  "1 complete scene run per month",
  "2,500 credits (~2.5 minutes of AI audio)",
  "3 basic AI voices",
  "Standard rehearsal mode",
];

const PRO_TEASE = [
  "Unlimited scene runs",
  "40,000 credits / month + 10 voices",
  "AI Performance Coach with per-line feedback",
  "Self-Tape Studio with 1080p export",
  "All 10 rehearsal modes (Subtext, Wildcard, Cold Read…)",
  "Audition Vault + Scene Exchange",
];

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  // Mark the user as onboarded on first visit so /dashboard stops redirecting here
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/users/me/onboard", { method: "POST" }).catch(() => {});
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-10">
        <span className="inline-block bg-success/15 text-success text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          You&apos;re on the Free plan
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Welcome to Line Runner, {firstName}
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Here&apos;s exactly what you can do right now — and what unlocks if you upgrade later.
          No credit card needed to keep using Free.
        </p>
      </div>

      {/* What's included */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-5">What&apos;s included on Free</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FREE_FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-surface border border-border rounded-2xl p-5 flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent-light flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  {f.icon}
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free plan limits */}
      <section className="mb-12">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h2 className="text-xl font-semibold">Free plan limits</h2>
            <span className="text-sm text-muted">No card required</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {FREE_LIMITS.map((limit) => (
              <li key={limit} className="flex items-start gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-muted">{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Upgrade tease */}
      <section className="mb-12">
        <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
              PRO — $20/month
            </span>
            <span className="text-sm text-muted">cancel anytime</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">When you&apos;re ready for more</h2>
          <p className="text-muted mb-5 max-w-2xl">
            Pro unlocks every rehearsal mode, the AI Performance Coach, full self-tape recording,
            and 10× the AI voice minutes — for working actors who rehearse regularly.
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {PRO_TEASE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-accent-light shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-accent/25"
            >
              See plans &amp; upgrade
            </Link>
            <Link
              href="/pricing#compare"
              className="text-accent-light hover:text-accent font-medium px-6 py-3 transition-colors"
            >
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Get started CTA */}
      <section className="text-center bg-surface border border-border rounded-2xl p-8 md:p-10">
        <h2 className="text-2xl font-bold mb-2">Ready to rehearse?</h2>
        <p className="text-muted mb-6 max-w-xl mx-auto">
          Upload a script (or try the built-in Romeo &amp; Juliet sample). We&apos;ll parse it,
          let you pick your part, and give every other character an AI voice.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/upload"
            className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            Upload your first script
          </Link>
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground font-medium px-6 py-3 transition-colors"
          >
            Skip to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
