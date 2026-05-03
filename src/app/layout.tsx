import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import SessionProvider from "@/components/auth/SessionProvider";
import TopNav from "@/components/nav/TopNav";
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
    "Upload your script, pick your part, and rehearse with AI voices reading every other role.",
  manifest: "/manifest.json",
  applicationName: "Line Runner",
  appleWebApp: {
    capable: true,
    title: "Line Runner",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c5ce7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SkipNav />
        <AriaLiveProvider>
        <I18nProvider>
        <SessionProvider>
          <TopNav user={user} />
          <main id="main-content" className="flex-1">{children}</main>
        </SessionProvider>

        <footer className="border-t border-border bg-surface/50 py-8 safe-pb safe-px">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="text-xs sm:text-sm text-muted text-center md:text-left leading-relaxed">
                &copy; {new Date().getFullYear()} Line Runner by Lightwork Digital.
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-y-2 gap-x-5 text-sm text-muted justify-items-center sm:justify-items-start">
                <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                <Link href="/vo-tools" className="hover:text-foreground transition-colors">VO Tools</Link>
                <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/refund" className="hover:text-foreground transition-colors">Refunds</Link>
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
