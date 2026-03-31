"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const EARN_LINKS = [
  { href: "/marketplace", label: "Masterclass Market" },
  { href: "/pass", label: "PASS Memberships" },
  { href: "/scene-exchange", label: "Scene Exchange" },
  { href: "/voice-print", label: "Voice Print Builder" },
  { href: "/studio", label: "STUDIO Dashboard" },
];

export default function EarnDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-base text-muted hover:text-foreground transition-colors flex items-center gap-1"
      >
        Earn
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-xl py-2 z-50">
          {EARN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-light transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
