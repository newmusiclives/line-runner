"use client";

import Link from "next/link";

const VO_TOOLS = [
  {
    title: "Audio Quality Monitor",
    description: "Real-time noise floor, clipping, proximity, and room tone monitoring",
    href: "/vo-tools/audio-monitor",
    icon: "M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z",
    color: "text-success",
    tag: "Booth",
  },
  {
    title: "Pronunciation Coach",
    description: "IPA guide, phonetic breakdown, and listen-and-repeat for tricky words",
    href: "/vo-tools/pronunciation",
    icon: "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z",
    color: "text-accent-light",
    tag: "Craft",
  },
  {
    title: "Breath & Plosive Detector",
    description: "Flag plosive impacts and breath intrusions before delivery",
    href: "/vo-tools/breath-detector",
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    color: "text-warning",
    tag: "Booth",
  },
  {
    title: "Copy Timing Calibrator",
    description: "Match your read to the exact time slot — 15s, 30s, or 60s spots",
    href: "/vo-tools/copy-timing",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-accent-light",
    tag: "Craft",
  },
  {
    title: "ADR & Dubbing Mode",
    description: "Lip-sync timing guide with waveform overlay for dubbing work",
    href: "/vo-tools/adr",
    icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 0A1.125 1.125 0 013.375 4.5h17.25M21 5.625v12.75m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125v-1.5m0 0a1.125 1.125 0 00-1.125-1.125M18 18.375h-1.5m0 0a1.125 1.125 0 01-1.125-1.125V15m1.125 3.375h.75M18 12.75h.008v.008H18V12.75zm0-3h.008v.008H18V9.75z",
    color: "text-danger",
    tag: "Specialist",
  },
  {
    title: "Voice Consistency Checker",
    description: "Maintain the same character voice from page 1 to page 40",
    href: "/vo-tools/voice-consistency",
    icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
    color: "text-success",
    tag: "Specialist",
  },
  {
    title: "Demo Reel Producer",
    description: "Build a broadcast-standard VO demo reel inside the app",
    href: "/vo-tools/demo-reel",
    icon: "M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z",
    color: "text-accent-light",
    tag: "Business",
  },
  {
    title: "Rate Calculator",
    description: "GVAA-based rate guidelines and negotiation coaching",
    href: "/vo-tools/rate-calculator",
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
    color: "text-warning",
    tag: "Business",
  },
  {
    title: "Client Delivery Portal",
    description: "Send files, invoice, usage rights, and get sign-off in one link",
    href: "/vo-tools/client-delivery",
    icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    color: "text-success",
    tag: "Business",
  },
  {
    title: "VO Training Curriculum",
    description: "7 genre tracks from foundational to professional with certification",
    href: "/vo-tools/curriculum",
    icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342",
    color: "text-accent-light",
    tag: "Education",
  },
];

const TAG_COLORS: Record<string, string> = {
  Booth: "bg-success/15 text-success border-success/30",
  Craft: "bg-accent/15 text-accent-light border-accent/30",
  Specialist: "bg-danger/15 text-danger border-danger/30",
  Business: "bg-warning/15 text-warning border-warning/30",
  Education: "bg-accent/15 text-accent-light border-accent/30",
};

export default function VOToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Voice Actor Professional Suite</h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Technical booth tools, business management, and career infrastructure for the working VO professional.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VO_TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-all group flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center shrink-0 ${tool.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${TAG_COLORS[tool.tag]}`}>
                {tool.tag}
              </span>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-accent-light transition-colors">{tool.title}</h3>
            <p className="text-sm text-muted flex-1">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
