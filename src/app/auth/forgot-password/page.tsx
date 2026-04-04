"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-muted">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                Check your email for a password reset link. It may take a minute to arrive.
              </div>
              <p className="text-sm text-muted">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="text-accent-light hover:text-accent transition-colors font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-accent-light hover:text-accent transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
