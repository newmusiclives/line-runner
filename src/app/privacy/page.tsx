import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Line Runner",
  description: "Privacy Policy for Line Runner — what we collect, how we use it, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted mb-10">Last updated: 1 May 2026</p>

      <div className="space-y-6 text-base leading-relaxed">
        <p className="text-muted">
          This Privacy Policy explains what we collect, how we use it, and the choices you have. If
          you have any questions, email{" "}
          <a href="mailto:privacy@linerunner.app" className="text-accent-light hover:text-accent underline">
            privacy@linerunner.app
          </a>
          .
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-2">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>
              <strong className="text-foreground">Account data:</strong> name, email, password hash,
              avatar, sign-in method.
            </li>
            <li>
              <strong className="text-foreground">Content you upload:</strong> scripts (text and PDF),
              voice assignments, annotations, bookmarks, recorded self-tapes (Pro/Studio plans).
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> rehearsal session duration,
              line metrics, feature usage, voice minutes consumed.
            </li>
            <li>
              <strong className="text-foreground">Payment data:</strong> we never see or store your
              card details. Stripe handles payments and stores billing information; we receive a
              customer ID and subscription status.
            </li>
            <li>
              <strong className="text-foreground">Technical data:</strong> IP address, browser type,
              session cookies (for authentication).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">How we use it</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>Provide the service: parse scripts, generate AI voices, store rehearsal history.</li>
            <li>Authenticate you and keep your account secure.</li>
            <li>Process payments and manage subscriptions.</li>
            <li>Send transactional email (account confirmations, password resets, billing receipts).</li>
            <li>Send product updates if you opted in (you can unsubscribe at any time).</li>
            <li>Improve the service via aggregate, anonymous metrics. We don&apos;t use your content to train AI models.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Who we share data with</h2>
          <p className="text-muted mb-3">
            We share only the minimum data necessary with the following processors:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>
              <strong className="text-foreground">Stripe</strong> — payment processing
            </li>
            <li>
              <strong className="text-foreground">Google (Gemini)</strong> — AI voice synthesis from
              your script text
            </li>
            <li>
              <strong className="text-foreground">Anthropic (Claude)</strong> — AI script analysis,
              performance coaching, emotion detection
            </li>
            <li>
              <strong className="text-foreground">GoHighLevel</strong> — CRM and transactional email
            </li>
            <li>
              <strong className="text-foreground">Neon</strong> — managed Postgres database hosting
            </li>
            <li>
              <strong className="text-foreground">Netlify</strong> — application hosting
            </li>
          </ul>
          <p className="text-muted mt-3">
            We do not sell your personal data. We do not share data with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <p className="text-muted">
            We use a small number of essential cookies for authentication and session state. We do
            not use third-party tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Your rights</h2>
          <p className="text-muted mb-3">
            Depending on where you live (GDPR, CCPA, UK GDPR, and similar laws), you may have the
            right to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and content</li>
            <li>Export your data in a portable format</li>
            <li>Object to or restrict processing</li>
          </ul>
          <p className="text-muted mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@linerunner.app" className="text-accent-light hover:text-accent underline">
              privacy@linerunner.app
            </a>
            . We&apos;ll respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Data retention</h2>
          <p className="text-muted">
            We keep your account and content for as long as your account is active. If you delete
            your account, we remove personal data within 30 days, except where retention is required
            by law (for example, billing records for tax purposes).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Children</h2>
          <p className="text-muted">
            Line Runner is not for children under 13. We do not knowingly collect data from anyone
            under 13. If you believe we have, contact{" "}
            <a href="mailto:privacy@linerunner.app" className="text-accent-light hover:text-accent underline">
              privacy@linerunner.app
            </a>{" "}
            and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Changes to this policy</h2>
          <p className="text-muted">
            We may update this policy. Material changes will be announced by email and on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
