import Link from "next/link";
import { BILLING_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Refund Policy — Line Runner",
  description: "Refund policy for Line Runner subscriptions and credit blocks.",
};

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
      <p className="text-muted mb-10">Last updated: 1 May 2026</p>

      <div className="space-y-6 text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">Cancellation</h2>
          <p className="text-muted">
            You can cancel your Pro or Studio subscription at any time from{" "}
            <Link href="/dashboard/subscription" className="text-accent-light hover:text-accent underline">
              Account → Subscription
            </Link>
            . Cancellation takes effect at the end of your current billing period — you keep access
            to paid features until then. We do not pro-rate or refund the unused portion of the
            current period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Refund eligibility</h2>
          <p className="text-muted mb-3">
            We offer refunds in the following cases:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>
              <strong className="text-foreground">First-time subscription, within 7 days:</strong>{" "}
              if you signed up for the first time and the service didn&apos;t meet your expectations,
              email us within 7 days of your first payment for a full refund.
            </li>
            <li>
              <strong className="text-foreground">Duplicate or accidental charges:</strong> we will
              refund duplicate charges or charges processed in error.
            </li>
            <li>
              <strong className="text-foreground">Service unavailability:</strong> if the service is
              unavailable for an extended period due to our fault, we may issue prorated credit or
              refunds at our discretion.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Non-refundable</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted">
            <li>Renewals after the first month are non-refundable. Cancel before renewal to avoid the next charge.</li>
            <li>Credit blocks (one-time purchases) are non-refundable once used. Unused credit blocks may be refunded within 30 days.</li>
            <li>
              Refunds are not available because a feature you expected was marked &quot;Coming
              Soon&quot;. Soon-tagged features are clearly labelled on the pricing page; your
              subscription gets them automatically when they ship.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">How to request a refund</h2>
          <p className="text-muted">
            Email{" "}
            <a
              href={`mailto:${BILLING_EMAIL}`}
              className="text-accent-light hover:text-accent underline"
            >
              {BILLING_EMAIL}
            </a>{" "}
            with the email address on your account and a brief reason. We aim to respond within 2
            business days. Approved refunds are processed back to the original payment method via
            Stripe and typically appear within 5–10 business days, depending on your bank.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Disputes</h2>
          <p className="text-muted">
            We&apos;d much rather resolve issues directly than via card chargeback. If something
            isn&apos;t right, please reach out before disputing the charge with your bank — we&apos;re
            usually able to fix it the same day.
          </p>
        </section>
      </div>
    </div>
  );
}
