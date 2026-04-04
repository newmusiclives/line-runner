"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AriaLiveContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AriaLiveCtx = createContext<AriaLiveContextType>({ announce: () => {} });

export function AriaLiveProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (priority === "assertive") {
      setAssertiveMessage("");
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage("");
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <AriaLiveCtx.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{politeMessage}</div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">{assertiveMessage}</div>
    </AriaLiveCtx.Provider>
  );
}

export function useAriaLive() {
  return useContext(AriaLiveCtx);
}
