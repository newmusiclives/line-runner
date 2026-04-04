"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
}

export default function FocusTrap({ children, active }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0] as HTMLElement;
    const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    firstEl?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return <div ref={ref}>{children}</div>;
}
