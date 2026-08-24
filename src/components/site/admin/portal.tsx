"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLogin } from "./login";
import { AdminDashboard } from "./dashboard";

/* Admin portal entry — preserves the original /#/admin workflow.
   On mount, checks if the visitor has a valid admin session cookie.
   If yes → render dashboard; if no → render login. */
export function AdminPortal({ onExit }: { onExit: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inquiries?stats=1");
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="section-dark flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-gold" aria-label="Checking session" />
      </div>
    );
  }

  return loggedIn ? (
    <AdminDashboard onLogout={() => setLoggedIn(false)} onExit={onExit} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} onExit={onExit} />
  );
}
