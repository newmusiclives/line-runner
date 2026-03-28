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
            <span className="text-base text-accent-light">
              AI-Powered Script Rehearsal
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Rehearse your lines
            <br />
            <span className="text-accent-light">with AI scene partners</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted mb-10 leading-relaxed">
            Upload any script — short episode, one act, or full three-act play.
            Pick your character, and our AI reads every other part with voices
            matched for age, gender, and accent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-accent/25"
            >
              Upload a Script
            </Link>
            <Link
              href="/pricing"
              className="border border-border hover:border-accent/50 text-foreground font-medium px-8 py-3.5 rounded-xl text-lg transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Try it Free */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Jump straight into a scene
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              No signup required. Pick a famous scene and start rehearsing in
              seconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            {/* Romeo & Juliet */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border bg-success/20 text-success border-success/30">
                  Beginner
                </span>
                <span className="text-sm text-muted">~5 min</span>
              </div>
              <h3 className="text-xl font-bold mb-1">
                Romeo &amp; Juliet — Balcony Scene
              </h3>
              <p className="text-base text-muted mb-1">William Shakespeare</p>
              <p className="text-lg text-muted leading-relaxed mb-5 flex-1">
                The iconic balcony scene where Romeo and Juliet declare their
                love. Perfect for beginners.
              </p>
              <Link
                href="/demo"
                className="block text-center bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-lg shadow-accent/25"
              >
                Try Now
              </Link>
            </div>

            {/* Hamlet */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border bg-danger/20 text-danger border-danger/30">
                  Advanced
                </span>
                <span className="text-sm text-muted">~6 min</span>
              </div>
              <h3 className="text-xl font-bold mb-1">
                Hamlet — To Be or Not To Be
              </h3>
              <p className="text-base text-muted mb-1">William Shakespeare</p>
              <p className="text-lg text-muted leading-relaxed mb-5 flex-1">
                Hamlet&apos;s most famous soliloquy, plus the encounter with
                Ophelia. A masterclass in subtext.
              </p>
              <Link
                href="/scenes"
                className="block text-center bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-lg shadow-accent/25"
              >
                Try Now
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/scenes"
              className="text-lg text-accent-light hover:text-accent font-medium transition-colors"
            >
              Browse all scenes &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-muted text-center mb-16 max-w-xl mx-auto">
            From script to rehearsal in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload your script",
                desc: "Drop in a PDF or text file. Our parser automatically detects characters, acts, scenes, and stage directions.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                ),
              },
              {
                step: "02",
                title: "Pick your part",
                desc: "Select which character you are playing. Assign AI voices to every other role — matched by age, gender, and accent.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                ),
              },
              {
                step: "03",
                title: "Rehearse",
                desc: "Hit play. AI voices read their lines aloud, then pause for yours. Practice timing, cues, and delivery.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-surface border border-border rounded-2xl p-8 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-accent-light"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <span className="text-base font-mono text-muted">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Script Types */}
      <section className="py-20 bg-surface/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Every format, every length
          </h2>
          <p className="text-muted text-center mb-16 max-w-xl mx-auto">
            Whether it&apos;s a short scene or a full-length play
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Short Episode",
                pages: "Up to 15 pages",
                chars: "Up to 10 characters",
                time: "~15-30 min",
                color: "from-green-500/20 to-green-500/5",
              },
              {
                name: "One Act",
                pages: "Up to 40 pages",
                chars: "Up to 15 characters",
                time: "~30-60 min",
                color: "from-accent/20 to-accent/5",
              },
              {
                name: "Three Acts",
                pages: "Up to 120 pages",
                chars: "Up to 25 characters",
                time: "~90-180 min",
                color: "from-orange-500/20 to-orange-500/5",
              },
            ].map((format) => (
              <div
                key={format.name}
                className={`bg-gradient-to-b ${format.color} border border-border rounded-2xl p-8`}
              >
                <h3 className="text-xl font-bold mb-4">{format.name}</h3>
                <ul className="space-y-3 text-muted">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {format.pages}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {format.chars}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {format.time}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Features */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Voices that fit the character
          </h2>
          <p className="text-muted text-center mb-16 max-w-xl mx-auto">
            AI voices matched by age, gender, and accent for authentic rehearsals
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Age Ranges", value: "Child to Elderly", sub: "4 age brackets" },
              { label: "Accents", value: "12+ Accents", sub: "British, American, Australian & more" },
              { label: "Voice Styles", value: "Natural & Expressive", sub: "Powered by ElevenLabs" },
              { label: "Customizable", value: "Pitch & Speed", sub: "Fine-tune each character" },
            ].map((feature) => (
              <div key={feature.label} className="bg-surface border border-border rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-accent-light mb-1">{feature.value}</div>
                <div className="text-base font-medium mb-1">{feature.label}</div>
                <div className="text-sm text-muted">{feature.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-accent/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to rehearse?</h2>
          <p className="text-muted text-lg mb-8">
            Upload your first script and start running lines in minutes.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-accent/25"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
