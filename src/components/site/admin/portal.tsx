"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLogin } from "./login";
import { AdminDashboard } from "./dashboard";

/* Admin portal entry — preserves the original /#/admin workflow.
   On mount, checks if the visitor has a valid admin session cookie.
   If yes → render dashboard; if no → render login.

   BATCH 7 (§44): also routes the invite-acceptance URL. Invitation
   emails link to /#/invite/<token> — that renders the login screen
   in activation mode (set name + password → account activates and
   the session starts immediately). */
export function AdminPortal({ onExit }: { onExit: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const parseInvite = () => {
      const hash = window.location.hash ?? "";
      const inviteMatch = hash.match(/^#\/invite\/([0-9a-f]{16,128})$/i);
      return inviteMatch ? inviteMatch[1] : null;
    };

    const handle = async () => {
      // Invite activation takes priority — renders even while signed in
      // (mount-time AND hashchange navigation, e.g. SPA transitions).
      const token = parseInvite();
      if (token) {
        setInviteToken(token);
        setChecking(false);
        return;
      }
      setInviteToken(null);
      try {
        // /api/admin/me returns 200 for ANY authenticated admin
        // regardless of permissions (permission-agnostic probe).
        const res = await fetch("/api/admin/me");
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      } finally {
        setChecking(false);
      }
    };

    void handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  if (checking) {
    return (
      <div className="section-dark flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-gold" aria-label="Checking session" />
      </div>
    );
  }

  if (inviteToken !== null) {
    return (
      <AdminLogin
        onLogin={() => {
          // Activation created the session — clean the hash and enter.
          window.location.hash = "#/admin";
          setLoggedIn(true);
        }}
        onExit={onExit}
        inviteToken={inviteToken}
        onCancelInvite={() => {
          window.location.hash = "#/admin";
          setInviteToken(null);
        }}
      />
    );
  }

  return loggedIn ? (
    <AdminDashboard onLogout={() => setLoggedIn(false)} onExit={onExit} />
  ) : (
    <AdminLogin onLogin={() => setLoggedIn(true)} onExit={onExit} />
  );
}
