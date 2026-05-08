"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  ScriptSummary,
  RehearsalSessionSummary,
  SubscriptionStatus,
} from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [rehearsals, setRehearsals] = useState<RehearsalSessionSummary[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scriptsRes, rehearsalsRes, subRes, meRes] = await Promise.all([
        fetch("/api/scripts"),
        fetch("/api/rehearsals"),
        fetch("/api/users/me/subscription"),
        fetch("/api/users/me"),
      ]);
      const scriptsData = scriptsRes.ok ? await scriptsRes.json() : [];
      const meData = meRes.ok ? await meRes.json() : null;

      // First-time user: send them through /welcome before showing the empty dashboard
      if (meData && !meData.onboarded_at && Array.isArray(scriptsData) && scriptsData.length === 0) {
        router.replace("/welcome");
        return;
      }

      setScripts(scriptsData);
      if (rehearsalsRes.ok) setRehearsals(await rehearsalsRes.json());
      if (subRes.ok) setSubscription(await subRes.json());
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFavorite = async (scriptId: string, current: boolean) => {
    setScripts((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, isFavorite: !current } : s
      )
    );
    await fetch(`/api/scripts/${scriptId}/favorite`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
  };

  const deleteScript = async (scriptId: string) => {
    if (!confirm("Delete this script? This cannot be undone.")) return;
    const res = await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
    if (res.ok) {
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalSessions = rehearsals.length;
  const favoriteCount = scripts.filter((s) => s.isFavorite).length;
  const subLabel = subscription?.planName || "No plan";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Scripts</h1>
          <p className="text-muted mt-1 text-sm sm:text-base">
            Welcome back, {session?.user?.name || "there"}
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Upload Script
        </Link>
      </div>

      {/* Free-tier upload-limit hint — shown when free user already has at least one script */}
      {(!subscription || subscription.planId === "free" || subscription.status !== "active") && scripts.length >= 1 && (
        <div className="mb-6 sm:mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-semibold">You&apos;re at your free upload limit.</span>{" "}
              <span className="text-muted">Subscribe to Pro ($20/mo, 110 minutes) for unlimited uploads, or buy a $5 credit block.</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/pricing"
                className="inline-block px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-md hover:bg-accent-dark transition-colors"
              >
                See plans
              </Link>
              <Link
                href="/dashboard/credits"
                className="inline-block px-3 py-1.5 bg-surface-light text-foreground text-xs font-medium rounded-md hover:bg-border transition-colors"
              >
                Buy credit block
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          {
            label: "Total Scripts",
            value: scripts.length,
            color: "text-accent-light",
          },
          {
            label: "Total Sessions",
            value: totalSessions,
            color: "text-success",
          },
          {
            label: "Favorites",
            value: favoriteCount,
            color: "text-warning",
          },
          {
            label: "Subscription",
            value: subLabel,
            color: "text-accent-light",
            small: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="text-sm text-muted mb-1">{stat.label}</div>
            <div
              className={`${stat.small ? "text-lg" : "text-2xl"} font-bold ${stat.color}`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Scripts Grid */}
      {scripts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-16 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-accent-light"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No scripts yet</h2>
          <p className="text-muted mb-6">
            Upload your first script to start rehearsing with AI scene partners.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Upload Your First Script
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                  {script.title}
                </h3>
                <button
                  onClick={() => toggleFavorite(script.id, script.isFavorite)}
                  className="shrink-0 ml-2 p-1"
                  title={
                    script.isFavorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      script.isFavorite
                        ? "text-warning fill-warning"
                        : "text-muted hover:text-warning"
                    }`}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    fill={script.isFavorite ? "currentColor" : "none"}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted mb-4">
                <span className="bg-surface-light px-2 py-0.5 rounded-full">
                  {script.characterCount} characters
                </span>
                <span className="bg-surface-light px-2 py-0.5 rounded-full">
                  {script.lineCount} lines
                </span>
                <span className="bg-surface-light px-2 py-0.5 rounded-full">
                  {script.estimatedLength}
                </span>
              </div>
              <div className="text-sm text-muted mb-4">
                Uploaded {formatDate(script.createdAt)}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/upload?scriptId=${script.id}`}
                  className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2 rounded-lg transition-colors text-center"
                >
                  Rehearse
                </Link>
                <button
                  onClick={() => deleteScript(script.id)}
                  className="p-2 text-muted hover:text-danger transition-colors rounded-lg hover:bg-surface-light"
                  title="Delete script"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Rehearsals */}
      {rehearsals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Rehearsals</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted font-medium">
                      Script
                    </th>
                    <th className="text-left py-3 px-4 text-muted font-medium">
                      Character
                    </th>
                    <th className="text-left py-3 px-4 text-muted font-medium hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-muted font-medium">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 text-muted font-medium hidden sm:table-cell">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rehearsals.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 px-4 font-medium">
                        {r.scriptTitle}
                      </td>
                      <td className="py-3 px-4 text-muted">{r.myCharacter}</td>
                      <td className="py-3 px-4 text-muted hidden sm:table-cell">
                        {formatDate(r.startedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface-light rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{
                                width: `${r.linesTotal > 0 ? (r.linesCompleted / r.linesTotal) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted">
                            {r.linesCompleted}/{r.linesTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted hidden sm:table-cell">
                        {formatDuration(r.durationSecs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
