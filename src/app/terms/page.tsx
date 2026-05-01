import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Line Runner",
  description: "Terms of Service for Line Runner — AI script rehearsal platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted mb-10">Last updated: 1 May 2026</p>

      <div className="prose prose-invert max-w-none space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
          <p className="text-muted">
            Line Runner is an AI-assisted script rehearsal platform operated by Lightwork Digital
            (&quot;we&quot;, &quot;us&quot;, &quot;Line Runner&quot;). By creating an account or
            using the service you agree to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. The service</h2>
          <p className="text-muted">
            Line Runner lets actors and voice artists upload scripts, rehearse with AI scene
            partners, and access related tools. The service is provided &quot;as is&quot; without
            warranty of any kind. Some features are flagged as &quot;coming soon&quot; — your
            subscription does not guarantee any specific feature ships on a specific date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Your account</h2>
          <p className="text-muted">
            You are responsible for keeping your password secure and for any activity under your
            account. You must be 13 or older to use Line Runner. We may suspend or terminate
            accounts that violate these Terms or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Your content</h2>
          <p className="text-muted">
            You keep all rights to scripts and recordings you upload. You grant us a limited licence
            to process them solely to provide the service (parsing, AI voice generation, storage,
            playback). We do not use your content to train AI models. You are responsible for having
            the rights to upload any script you submit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Acceptable use</h2>
          <p className="text-muted">You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted">
            <li>Upload content you don&apos;t have the rights to use</li>
            <li>Use the service to harass, defame, or harm others</li>
            <li>Reverse engineer, scrape, or attempt to bypass usage limits</li>
            <li>Share your account with others or resell access</li>
            <li>Use the service for illegal purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Subscriptions and payment</h2>
          <p className="text-muted">
            Paid plans are billed monthly via Stripe. Charges renew automatically until you cancel.
            You can cancel at any time from <Link href="/dashboard/subscription" className="text-accent-light hover:text-accent underline">Account → Subscription</Link>;
            cancellation takes effect at the end of the current billing period. See our{" "}
            <Link href="/refund" className="text-accent-light hover:text-accent underline">Refund Policy</Link>{" "}
            for refund eligibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Third-party services</h2>
          <p className="text-muted">
            Line Runner uses Stripe (payments), Google Gemini (AI voice generation), Anthropic Claude
            (AI script analysis), and GoHighLevel (CRM and email). Your data is shared with these
            providers only as necessary to deliver the service, governed by their own privacy
            policies. See the{" "}
            <Link href="/privacy" className="text-accent-light hover:text-accent underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Termination</h2>
          <p className="text-muted">
            You can delete your account at any time. We may terminate or suspend access for breach
            of these Terms. On termination your scripts and account data will be deleted within 30
            days unless retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Limitation of liability</h2>
          <p className="text-muted">
            To the maximum extent permitted by law, Line Runner&apos;s total liability arising from
            your use of the service is limited to the amount you paid us in the twelve months prior
            to the claim. We are not liable for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Changes to these Terms</h2>
          <p className="text-muted">
            We may update these Terms occasionally. Material changes will be communicated by email
            and on this page. Continued use after the effective date means you accept the changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contact</h2>
          <p className="text-muted">
            Questions about these Terms? Email{" "}
            <a href="mailto:hello@linerunner.app" className="text-accent-light hover:text-accent underline">
              hello@linerunner.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
