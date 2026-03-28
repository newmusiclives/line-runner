"use client";

import { useState, useEffect, useMemo } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  suspended_at: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.users || []);
        }
      } catch {
        // Handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleSuspend = async (userId: string, suspend: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: suspend ? "suspend" : "unsuspend",
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status: suspend ? "suspended" : "active",
                  suspended_at: suspend ? new Date().toISOString() : null,
                }
              : u
          )
        );
      }
    } catch {
      // Handle silently
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "make-admin" }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: "admin" } : u))
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
        <h1 className="text-3xl font-bold">User Management</h1>
        <span className="text-muted text-base">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-base focus:outline-none focus:border-accent placeholder:text-muted/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-muted font-medium hidden md:table-cell">
                  Joined
                </th>
                <th className="text-right py-3 px-4 text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const isSuspended =
                  user.status === "suspended" || !!user.suspended_at;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-muted">{user.email}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span
                        className={`text-sm px-2 py-0.5 rounded-full ${
                          user.role === "admin"
                            ? "bg-accent/10 text-accent-light"
                            : "bg-surface-light text-muted"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                          isSuspended
                            ? "bg-danger/10 text-danger"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted hidden md:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleSuspend(user.id, !isSuspended)
                          }
                          disabled={actionLoading === user.id}
                          className={`text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            isSuspended
                              ? "bg-success/10 text-success hover:bg-success/20"
                              : "bg-danger/10 text-danger hover:bg-danger/20"
                          }`}
                        >
                          {isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-sm px-3 py-1.5 rounded-lg bg-surface-light text-muted hover:text-foreground hover:bg-border transition-colors disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted"
                  >
                    {search
                      ? "No users match your search"
                      : "No users found"}
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
