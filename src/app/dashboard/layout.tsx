"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Scripts",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    ),
  },
  {
    href: "/dashboard/history",
    label: "History",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    href: "/dashboard/stats",
    label: "Stats",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    ),
  },
  {
    href: "/dashboard/subscription",
    label: "Subscription",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg
          className="w-8 h-8 text-accent animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border shrink-0 hidden md:block">
        <div className="p-6">
          <div className="text-sm text-muted uppercase tracking-wider font-medium mb-1">
            Dashboard
          </div>
          <div className="text-foreground font-semibold truncate">
            {session?.user?.name || session?.user?.email}
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors ${
                  active
                    ? "bg-accent/10 text-accent-light font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-light"
                }`}
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 flex">
        {sidebarLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-accent-light" : "text-muted"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {link.icon}
              </svg>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
