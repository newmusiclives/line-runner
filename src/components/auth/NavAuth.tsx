"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface NavAuthProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export default function NavAuth({ user }: NavAuthProps) {
  if (!user) {
    return (
      <>
        <Link
          href="/auth/login"
          className="text-base text-muted hover:text-foreground transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth/register"
          className="bg-accent hover:bg-accent-dark text-white text-base font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </>
    );
  }

  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="text-base text-muted hover:text-foreground transition-colors"
        >
          Admin
        </Link>
      )}
      <Link
        href="/dashboard"
        className="text-base text-muted hover:text-foreground transition-colors"
      >
        Dashboard
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-base text-muted hover:text-foreground transition-colors"
      >
        Sign Out
      </button>
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-white">
          {initials}
        </div>
        {user.name && (
          <span className="text-sm text-foreground hidden sm:inline">
            {user.name}
          </span>
        )}
      </Link>
    </>
  );
}
