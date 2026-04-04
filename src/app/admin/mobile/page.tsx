"use client";

export default function MobileAppPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Mobile App</h1>
      <p className="text-muted mb-8">Build and distribute Line Runner as a native iOS/Android app.</p>

      <div className="space-y-6">
        {/* Status */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Capacitor Configuration</h2>
              <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">Ready</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-surface-light rounded-xl p-4">
              <div className="text-xs text-muted mb-1">App ID</div>
              <div className="font-mono">app.linerunner.rehearse</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4">
              <div className="text-xs text-muted mb-1">App Name</div>
              <div className="font-mono">Line Runner</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4">
              <div className="text-xs text-muted mb-1">Web URL</div>
              <div className="font-mono text-xs">rehearse-perform-earn.netlify.app</div>
            </div>
            <div className="bg-surface-light rounded-xl p-4">
              <div className="text-xs text-muted mb-1">PWA Status</div>
              <div className="font-mono text-success">Enabled</div>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Setup Steps</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: "Install Capacitor", cmd: "npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android" },
              { step: 2, title: "Initialize platforms", cmd: "npx cap add ios && npx cap add android" },
              { step: 3, title: "Build the web app", cmd: "npm run build" },
              { step: 4, title: "Sync web assets", cmd: "npx cap sync" },
              { step: 5, title: "Open in Xcode (iOS)", cmd: "npx cap open ios" },
              { step: 6, title: "Open in Android Studio", cmd: "npx cap open android" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{item.title}</div>
                  <code className="block bg-surface-light rounded-lg px-3 py-2 text-xs font-mono text-muted">{item.cmd}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PWA Note */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
          <h3 className="font-semibold mb-2">PWA Already Works</h3>
          <p className="text-sm text-muted">
            Line Runner is already installable as a Progressive Web App. Users can add it to their home screen from any browser. Capacitor wraps this same PWA in a native shell for App Store / Play Store distribution.
          </p>
        </div>
      </div>
    </div>
  );
}
