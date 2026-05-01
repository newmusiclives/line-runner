import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import SessionProvider from "@/components/auth/SessionProvider";
import NavAuth from "@/components/auth/NavAuth";
import EarnDropdown from "@/components/nav/EarnDropdown";
import SkipNav from "@/components/SkipNav";
import { AriaLiveProvider } from "@/components/AriaLive";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Line Runner — AI Script Rehearsal",
  description:
    "Upload your script, pick your part, and rehearse with AI voices reading every other role. Powered by Manifest Financial.",
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role as string | undefined,
      }
    : null;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#6c5ce7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SkipNav />
        <AriaLiveProvider>
        <I18nProvider>
        <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
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
                <span className="text-xl font-bold tracking-tight">
                  Line<span className="text-accent-light">Runner</span>
                </span>
              </Link>

              <div className="flex items-center gap-5">
                {user ? (
                  <>
                    <Link href="/upload" className="text-sm text-muted hover:text-foreground transition-colors">Rehearse</Link>
                    <Link href="/vault" className="text-sm text-muted hover:text-foreground transition-colors">Vault</Link>
                    <Link href="/self-tape" className="text-sm text-muted hover:text-foreground transition-colors">Self-Tape</Link>
                    <Link href="/vo-tools" className="text-sm text-muted hover:text-foreground transition-colors">VO Tools</Link>
                    <EarnDropdown />
                  </>
                ) : (
                  <>
                    <Link href="/scenes" className="text-sm text-muted hover:text-foreground transition-colors">Scenes</Link>
                    <Link href="/pricing" className="text-sm text-muted hover:text-foreground transition-colors">Pricing</Link>
                  </>
                )}
                <NavAuth user={user} />
              </div>
            </div>
          </div>
        </nav>

        <SessionProvider>
          <main id="main-content" className="flex-1">{children}</main>
        </SessionProvider>

        <footer className="border-t border-border bg-surface/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted">
                &copy; {new Date().getFullYear()} Line Runner by Lightwork Digital. Payments
                processed by{" "}
                <span className="text-foreground font-medium">
                  Manifest Financial
                </span>
                .
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                <Link href="/vo-tools" className="hover:text-foreground transition-colors">VO Tools</Link>
                <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/refund" className="hover:text-foreground transition-colors">Refunds</Link>
                <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign In</Link>
              </div>
            </div>
          </div>
        </footer>
        </I18nProvider>
        </AriaLiveProvider>
      </body>
    </html>
  );
}
