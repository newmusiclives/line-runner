import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-base text-accent-light">The World&apos;s Best Actor Rehearsal Platform</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 whitespace-nowrap">
            Rehearse. Perform. <span className="text-accent-light">Earn.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted mb-10 leading-relaxed">
            30 professional features for actors and voice actors. AI coaching, craft tools, self-tape studio, income streams, and a complete VO career suite — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/upload" className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-accent/25">
              Start Rehearsing Free
            </Link>
            <Link href="/demo" className="border border-border hover:border-accent/50 text-foreground font-medium px-8 py-3.5 rounded-xl text-lg transition-colors">
              Try Demo
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10 text-base text-muted">
            <span className="flex items-center gap-2"><span className="text-2xl font-bold text-accent-light">30</span> Features</span>
            <span className="flex items-center gap-2"><span className="text-2xl font-bold text-accent-light">10</span> Rehearsal Modes</span>
            <span className="flex items-center gap-2"><span className="text-2xl font-bold text-accent-light">5+</span> Income Streams</span>
          </div>
        </div>
      </section>

      {/* No Competitor Has This */}
      <section className="py-16 border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">What no competitor offers</h2>
          <p className="text-muted text-lg max-w-xl mx-auto mb-10">The timing control system, AI coaching, and income tools that make Line Runner unique.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Dynamic Timing Control", desc: "Inter-line gap, scene tempo, and actor response window that no competitor has built", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
              { title: "AI Performance Coach", desc: "Specific, timestamped notes after every take — pacing, energy, timing, delivery", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904" },
              { title: "Subtext Mode", desc: "AI performs the unspoken intention beneath the words — the most ambitious feature in the market", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227" },
              { title: "Income Streams", desc: "The first rehearsal platform where actors earn money from their craft, voice, and audience", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75" },
            ].map((f) => (
              <div key={f.title} className="bg-surface border border-border rounded-xl p-6 text-left">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance & Rehearsal Intelligence */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-accent-light uppercase tracking-wide">For Every Actor</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Performance & Rehearsal Intelligence</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">20 features that transform Line Runner from a tool into a coach, a craft studio, and a career platform.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Script Analysis on Upload", desc: "Genre, tone, character arcs, key beats — delivered in under 10 seconds", tag: "AI" },
              { title: "Line Memory Tracker", desc: "Tracks your sticking points across sessions with a stumble heatmap", tag: "AI" },
              { title: "Emotional Arc Mapping", desc: "Visualise the scene's emotional intensity with tap-to-replay graph", tag: "AI" },
              { title: "Objective & Obstacle Mode", desc: "Stanislavski built into software — give every character a want and a block", tag: "Craft" },
              { title: "Relationship Dynamics", desc: "Set intimacy and power between characters with two simple sliders", tag: "Craft" },
              { title: "Wildcard Mode", desc: "AI gives a different emotional interpretation every take — stay surprised", tag: "Craft" },
              { title: "Director's Cut Mode", desc: "Record audio notes tagged to specific lines for remote collaboration", tag: "Craft" },
              { title: "Cold Read Mode", desc: "Script revealed one line at a time — genuine discovery on every exchange", tag: "Craft" },
              { title: "10 Rehearsal Modes", desc: "Standard, Memorization, Speed Run, Cue Only, Teleprompter, Backstage, and more", tag: "Workflow" },
              { title: "Annotation Layer", desc: "Highlight, colour-code, and leave voice notes on any line", tag: "Workflow" },
              { title: "Audition Vault", desc: "Every script, voice config, and take — searchable and always accessible", tag: "Workflow" },
              { title: "Self-Tape Studio", desc: "Camera frame guide, eyeline dot, auto-slate, and 1080p export", tag: "Workflow" },
              { title: "Pre-Audition Ritual", desc: "Breathing, motivational cue, countdown — train the transition into performance", tag: "Workflow" },
              { title: "Sleep Learning Mode", desc: "Slow looping playback designed for passive memorisation before bed", tag: "Workflow" },
              { title: "Monologue Masterclass", desc: "Sell your best takes as teaching content to other actors", tag: "Income" },
              { title: "Line Runner PASS", desc: "Fan memberships — subscribers access your takes, coaching, and content", tag: "Income" },
              { title: "Scene Exchange", desc: "Rehearse with a real human partner through the app, any time zone", tag: "Platform" },
              { title: "Voice Print Builder", desc: "Build your ElevenLabs Marketplace voice asset inside the app", tag: "Income" },
              { title: "Line Runner STUDIO", desc: "Full creative business dashboard — every income stream in one place", tag: "Income" },
              { title: "AI Performance Coach", desc: "3-5 specific, timestamped notes per take — never generic praise", tag: "AI" },
            ].map((f) => (
              <div key={f.title} className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    f.tag === "AI" ? "bg-accent/15 text-accent-light" :
                    f.tag === "Craft" ? "bg-success/15 text-success" :
                    f.tag === "Workflow" ? "bg-warning/15 text-warning" :
                    f.tag === "Income" ? "bg-danger/15 text-danger" :
                    "bg-muted/15 text-muted"
                  }`}>{f.tag}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Actor Professional Suite */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-success/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-success uppercase tracking-wide">For Voice Actors</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Voice Actor Professional Suite</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">10 features built specifically for the working VO professional — booth craft, business tools, and career infrastructure.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Audio Quality Monitor", desc: "Real-time noise floor, clipping, proximity, and room tone monitoring with colour-coded warnings", tag: "Booth", href: "/vo-tools/audio-monitor" },
              { title: "Pronunciation Coach", desc: "IPA guide, phonetic breakdown, and listen-and-repeat with a personal pronunciation dictionary", tag: "Craft", href: "/vo-tools/pronunciation" },
              { title: "Breath & Plosive Detector", desc: "Flag every plosive impact and breath intrusion with severity ratings before delivery", tag: "Booth", href: "/vo-tools/breath-detector" },
              { title: "ADR & Dubbing Mode", desc: "Lip-sync timing guide with waveform overlay — the highest-paying VO category, now rehearsable", tag: "Specialist", href: "/vo-tools/adr" },
              { title: "Copy Timing Calibrator", desc: "Hit the mark on 15s, 30s, or 60s spots with a live colour-coded progress bar", tag: "Craft", href: "/vo-tools/copy-timing" },
              { title: "Voice Consistency Checker", desc: "Maintain the same character voice from page 1 to page 40 across multiple sessions", tag: "Specialist", href: "/vo-tools/voice-consistency" },
              { title: "Demo Reel Producer", desc: "Build a broadcast-standard VO demo reel across 7 genres with licensed music beds", tag: "Business", href: "/vo-tools/demo-reel" },
              { title: "Client Delivery Portal", desc: "Files, invoice, usage rights, and sign-off in one professional link", tag: "Business", href: "/vo-tools/client-delivery" },
              { title: "Rate Calculator", desc: "GVAA-based rate guidelines plus negotiation coaching for 5 common pushback scenarios", tag: "Business", href: "/vo-tools/rate-calculator" },
              { title: "VO Genre Training", desc: "7 genres, 5 levels each, 105 graded scripts with AI coaching and certification", tag: "Education", href: "/vo-tools/curriculum" },
            ].map((f) => (
              <Link key={f.title} href={f.href} className="bg-surface border border-border rounded-xl p-6 hover:border-success/30 transition-all group">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  f.tag === "Booth" ? "bg-success/15 text-success" :
                  f.tag === "Craft" ? "bg-accent/15 text-accent-light" :
                  f.tag === "Specialist" ? "bg-danger/15 text-danger" :
                  f.tag === "Business" ? "bg-warning/15 text-warning" :
                  "bg-accent/15 text-accent-light"
                }`}>{f.tag}</span>
                <h3 className="font-semibold mt-3 mb-1 group-hover:text-success transition-colors">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/vo-tools" className="inline-block bg-success/10 hover:bg-success/20 text-success font-medium px-8 py-3 rounded-xl transition-colors border border-success/20">
              Explore All VO Tools
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How it works</h2>
          <p className="text-muted text-center mb-16 max-w-xl mx-auto">From script to rehearsal in three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload your script", desc: "Drop in a PDF or text file. AI instantly analyses genre, tone, character arcs, and key beats.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
              { step: "02", title: "Pick your part & mode", desc: "Choose your character, assign AI voices, select from 10 rehearsal modes, set objectives and subtext.", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
              { step: "03", title: "Rehearse & earn", desc: "Run lines with AI coaching. Record self-tapes. Build your voice print. Sell masterclasses. Grow your career.", icon: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" },
            ].map((item) => (
              <div key={item.step} className="bg-surface border border-border rounded-2xl p-8 hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  </div>
                  <span className="text-base font-mono text-muted">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Simple, credit-based pricing</h2>
          <p className="text-muted text-lg max-w-xl mx-auto mb-10">1 credit = 1 character of AI dialogue. ~1,000 credits = ~1 minute of audio. Start free, upgrade when you&apos;re ready.</p>
          <div className="grid md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            <div className="bg-surface border border-border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <div className="text-2xl font-bold mb-4">$0</div>
              <ul className="space-y-2 text-sm text-muted text-left mb-6">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>1 scene run per month</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>2,500 credits (~2.5 min AI audio)</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Script analysis + Line Memory</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Teleprompter + Bookmarks</li>
              </ul>
              <Link href="/auth/register" className="block w-full bg-surface-light hover:bg-border text-foreground font-medium py-3 rounded-xl text-center transition-colors">Get Started Free</Link>
            </div>
            <div className="bg-surface border-2 border-accent rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <div className="text-2xl font-bold mb-1">$20<span className="text-lg text-muted font-normal">/mo</span></div>
              <div className="text-xs text-accent-light mb-4">40,000 credits/month</div>
              <ul className="space-y-2 text-sm text-muted text-left mb-6">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Unlimited scene runs</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>All 10 rehearsal modes + AI Coach</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Self-Tape Studio with 1080p export</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>10 AI voices, full customisation</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Credit blocks from $8 when you need more</li>
              </ul>
              <Link href="/pricing" className="block w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl text-center transition-colors shadow-lg shadow-accent/25">Start Free Trial</Link>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Studio</h3>
              <div className="text-2xl font-bold mb-1">$90<span className="text-lg text-muted font-normal">/mo</span></div>
              <div className="text-xs text-success mb-4">75,000 credits/month</div>
              <ul className="space-y-2 text-sm text-muted text-left mb-6">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span className="text-foreground font-medium">Everything in Pro + 25 voices</span></li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>VO Professional Suite (10 tools)</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Income tools + STUDIO dashboard</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Credit blocks at best rates</li>
              </ul>
              <Link href="/pricing" className="block w-full bg-surface-light hover:bg-border text-foreground font-medium py-3 rounded-xl text-center transition-colors">Get Studio</Link>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-8 bg-gradient-to-b from-warning/5 to-transparent">
              <h3 className="text-xl font-bold mb-1">Enterprise</h3>
              <div className="text-2xl font-bold mb-1">Custom</div>
              <div className="text-xs text-warning mb-4">Unlimited credits</div>
              <ul className="space-y-2 text-sm text-muted text-left mb-6">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span className="text-foreground font-medium">Everything in Studio</span></li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Multi-seat admin + SSO</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Stage schools + theatre cos.</li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Dedicated account manager</li>
              </ul>
              <a href="mailto:enterprise@linerunner.app" className="block w-full bg-warning/10 hover:bg-warning/20 text-warning font-medium py-3 rounded-xl text-center transition-colors border border-warning/20">Contact Sales</a>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/pricing" className="text-accent-light hover:text-accent transition-colors">View full comparison and FAQ &rarr;</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform your craft?</h2>
          <p className="text-muted text-lg mb-8">Join actors and voice actors who rehearse, grow, and earn on Line Runner.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-accent/25">
              Create Free Account
            </Link>
            <Link href="/demo" className="inline-block border border-border hover:border-accent/50 text-foreground font-medium px-8 py-3.5 rounded-xl text-lg transition-colors">
              Try the Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
