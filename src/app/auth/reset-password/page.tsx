"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-4">
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              Invalid reset link. Please request a new password reset.
            </div>
            <Link
              href="/auth/forgot-password"
              className="inline-block text-accent-light hover:text-accent transition-colors font-medium text-sm"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-2 text-muted">Choose a strong password for your account</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                Your password has been reset successfully.
              </div>
              <Link
                href="/auth/login"
                className="inline-block rounded-lg bg-accent hover:bg-accent-dark text-white font-medium py-2.5 px-6 transition-colors"
              >
                Sign in
              </Link>
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
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
