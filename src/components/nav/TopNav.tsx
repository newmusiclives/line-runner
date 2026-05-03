"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import EarnDropdown from "@/components/nav/EarnDropdown";

interface NavUser {
  name?: string | null;
  email?: string | null;
  role?: string;
}

const SIGNED_IN_LINKS = [
  { href: "/upload", label: "Rehearse" },
  { href: "/vault", label: "Vault" },
  { href: "/self-tape", label: "Self-Tape" },
  { href: "/vo-tools", label: "VO Tools" },
];

const EARN_LINKS = [
  { href: "/marketplace", label: "Masterclass Market" },
  { href: "/pass", label: "PASS Memberships" },
  { href: "/scene-exchange", label: "Scene Exchange" },
  { href: "/voice-print", label: "Voice Print Builder" },
  { href: "/studio", label: "STUDIO Dashboard" },
];

const SIGNED_OUT_LINKS = [
  { href: "/scenes", label: "Scenes" },
  { href: "/pricing", label: "Pricing" },
];

export default function TopNav({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initials = user
    ? (user.name || user.email || "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50 safe-pt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2l3.5-4.5A.5.5 0 0110.5 5v14a.5.5 0 01-.834.372L6 15z"
                />
              </svg>
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight truncate">
              Line<span className="text-accent-light">Runner</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-5">
            {user ? (
              <>
                {SIGNED_IN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
                <EarnDropdown />
              </>
            ) : (
              <>
                {SIGNED_OUT_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </>
            )}
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-white">
                    {initials}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile: avatar (signed in) + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                className="flex items-center"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-white">
                  {initials}
                </div>
              </Link>
            )}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="tap-target inline-flex items-center justify-center rounded-lg text-foreground hover:bg-surface-light transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border bg-surface/95 backdrop-blur-sm safe-pb max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-4 py-3 flex flex-col">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-base font-medium text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    {user.name && (
                      <div className="text-sm font-medium truncate">
                        {user.name}
                      </div>
                    )}
                    {user.email && (
                      <div className="text-xs text-muted truncate">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
                {SIGNED_IN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="px-2 pt-4 pb-1 text-[11px] uppercase tracking-wide text-muted">
                  Earn
                </div>
                {EARN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="border-t border-border mt-2 pt-2">
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
                    className="w-full text-left px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                {SIGNED_OUT_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href="/auth/login"
                  onClick={closeMenu}
                  className="px-2 py-3 text-base text-foreground/90 hover:bg-surface-light rounded-lg transition-colors tap-target flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMenu}
                  className="mt-2 bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-3 rounded-xl text-center transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
