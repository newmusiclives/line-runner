"use client";

import { useState, useEffect } from "react";

interface AdminScript {
  id: string;
  title: string;
  user_name: string;
  user_email: string;
  character_count: number;
  status: string;
  created_at: string;
}

export default function AdminScriptsPage() {
  const [scripts, setScripts] = useState<AdminScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScripts() {
      try {
        const res = await fetch("/api/admin/scripts");
        if (res.ok) {
          const data = await res.json();
          setScripts(Array.isArray(data) ? data : data.scripts || []);
        }
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchScripts();
  }, []);

  const handleAction = async (
    scriptId: string,
    action: "flag" | "remove" | "restore"
  ) => {
    setActionLoading(scriptId);
    try {
      const res = await fetch("/api/admin/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          status: action === "flag" ? "flagged" : action === "remove" ? "removed" : "active",
        }),
      });
      if (res.ok) {
        const statusMap: Record<string, string> = {
          flag: "flagged",
          remove: "removed",
          restore: "active",
        };
        setScripts((prev) =>
          prev.map((s) =>
            s.id === scriptId ? { ...s, status: statusMap[action] } : s
          )
        );
      }
    } catch {
      // Handle silently
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    flagged: "bg-warning/10 text-warning",
    removed: "bg-danger/10 text-danger",
  };

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Script Moderation</h1>
        <span className="text-muted text-base">
          {scripts.length} script{scripts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium hidden sm:table-cell">
                  User
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium hidden md:table-cell">
                  Characters
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium hidden md:table-cell">
                  Uploaded
                </th>
                <th className="text-right py-3 px-4 text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script) => (
                <tr
                  key={script.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                    {script.title}
                  </td>
                  <td className="py-3 px-4 text-muted hidden sm:table-cell">
                    <div className="truncate max-w-[160px]">
                      {script.user_name || script.user_email}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted hidden md:table-cell">
                    {script.character_count}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        statusColors[script.status] || statusColors.active
                      }`}
                    >
                      {script.status.charAt(0).toUpperCase() +
                        script.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted hidden md:table-cell">
                    {formatDate(script.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {script.status !== "flagged" &&
                        script.status !== "removed" && (
                          <button
                            onClick={() => handleAction(script.id, "flag")}
                            disabled={actionLoading === script.id}
                            className="text-sm px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                          >
                            Flag
                          </button>
                        )}
                      {script.status !== "removed" && (
                        <button
                          onClick={() => handleAction(script.id, "remove")}
                          disabled={actionLoading === script.id}
                          className="text-sm px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      {(script.status === "flagged" ||
                        script.status === "removed") && (
                        <button
                          onClick={() => handleAction(script.id, "restore")}
                          disabled={actionLoading === script.id}
                          className="text-sm px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {scripts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted"
                  >
                    No scripts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
