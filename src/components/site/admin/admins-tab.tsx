"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Clock3,
  History,
  Loader2,
  MailPlus,
  PencilLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "./types";

/* ── BATCH 7 (§44–47) — Admins & roles management tab ──────────
   Visible only to manage_admins holders (server enforces anyway).
   Three panels: administrators list + invite (§44 workflow), role
   editor (§44/§45 configurable capabilities), audit log trail.    */

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  roleKey: string;
  status: string;
  invitedBy: string | null;
  inviteExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminRoleRow = {
  key: string;
  label: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
};

export type AdminAuditRow = {
  id: string;
  actorEmail: string;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

/* Permission vocabulary mirrored from admin-rbac (client-safe copy). */
const PERMISSIONS: { key: string; label: string }[] = [
  { key: "view_dashboard", label: "View dashboard & analytics" },
  { key: "view_customers", label: "View customers" },
  { key: "edit_customers", label: "Edit customers" },
  { key: "import_customers", label: "Import customers" },
  { key: "view_invoices", label: "View invoices & proposals" },
  { key: "create_invoices", label: "Create invoices & proposals" },
  { key: "manage_payments", label: "Manage payments" },
  { key: "manage_posts", label: "Manage posts & media" },
  { key: "moderate_comments", label: "Moderate comments" },
  { key: "manage_ads", label: "Manage ads" },
  { key: "broadcast_subscribers", label: "Broadcast to subscribers" },
  { key: "access_ai", label: "Access AI assistance" },
  { key: "manage_events", label: "Manage events" },
  { key: "manage_students", label: "Manage students" },
  { key: "manage_admins", label: "Manage administrators" },
  { key: "manage_settings", label: "Manage settings & backups" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "border-teal/30 bg-teal-dim text-teal",
  invited: "border-gold/30 bg-gold-dim text-gold",
  disabled: "border-red-400/30 bg-red-400/10 text-red-300",
};

const ACTION_LABELS: Record<string, string> = {
  "admin.login": "Signed in",
  "admin.invite": "Invited an admin",
  "admin.invite_resend": "Resent an invite",
  "admin.update": "Updated an admin",
  "admin.delete": "Removed an admin",
  "admin.activated": "Activated their account",
  "role.create": "Created a role",
  "role.update": "Updated role capabilities",
  "role.delete": "Deleted a role",
};

export function AdminsTab({
  canManageAdmins,
  onChanged,
}: {
  canManageAdmins: boolean;
  onChanged?: () => void;
}) {
  const [panel, setPanel] = useState<"users" | "roles" | "audit">("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [audit, setAudit] = useState<AdminAuditRow[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error("Could not load administrators — your role may lack this capability.");
      const data = (await res.json()) as { users: AdminUserRow[]; roles: AdminRoleRow[] };
      setUsers(data.users);
      setRoles(data.roles);
      const auditRes = await fetch("/api/admin/audit?limit=100");
      if (auditRes.ok) {
        const ad = (await auditRes.json()) as { entries: AdminAuditRow[]; total: number };
        setAudit(ad.entries);
        setAuditTotal(ad.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        u.roleKey.toLowerCase().includes(q)
    );
  }, [users, query]);

  const roleLabel = useCallback((key: string) => roles.find((r) => r.key === key)?.label ?? key, [roles]);

  return (
    <div className="space-y-4">
      {/* Panel switcher */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin management panels">
          {(
            [
              { id: "users", label: "Administrators", icon: Users2 },
              { id: "roles", label: "Roles & capabilities", icon: UserCog },
              { id: "audit", label: "Audit log", icon: History },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={panel === p.id}
              onClick={() => setPanel(p.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-medium transition-colors",
                panel === p.id
                  ? "border-gold/40 bg-gold-dim text-gold"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground"
              )}
            >
              <p.icon size={14} aria-hidden="true" />
              {p.label}
              {p.id === "users" && users.length > 0 && (
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">{users.length}</span>
              )}
              {p.id === "audit" && auditTotal > 0 && (
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px]">{auditTotal}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {panel === "users" && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search admins…"
                aria-label="Search administrators"
                className="w-44 rounded-xl border border-white/[0.09] bg-white/[0.03] py-2 pl-9 pr-3 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-56"
              />
            </div>
          )}
          <button
            onClick={() => void load()}
            aria-label="Reload"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground transition-colors hover:text-gold"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="surface-card border-red-500/25 p-4 text-[12.5px] text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="surface-card flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : (
        <>
          {panel === "users" && (
            <UsersPanel
              users={filtered}
              roles={roles}
              roleLabel={roleLabel}
              onReload={load}
              onChanged={onChanged}
            />
          )}
          {panel === "roles" && <RolesPanel roles={roles} onReload={load} />}
          {panel === "audit" && <AuditPanel entries={audit} total={auditTotal} />}
        </>
      )}
    </div>
  );
}

/* ── Users panel ─────────────────────────────────────────────────── */

function UsersPanel({
  users,
  roles,
  roleLabel,
  onReload,
  onChanged,
}: {
  users: AdminUserRow[];
  roles: AdminRoleRow[];
  roleLabel: (key: string) => string;
  onReload: () => Promise<void> | void;
  onChanged?: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const patch = async (id: string, body: Record<string, unknown>, successMsg: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      setNotice(successMsg);
      await onReload();
      onChanged?.();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this administrator? Their sessions are revoked immediately.")) return;
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Delete failed");
      setNotice("Administrator removed.");
      await onReload();
      onChanged?.();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-[14.5px] font-semibold text-foreground">Team administrators</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            §44 invite workflow: send an invitation email → invitee accepts → account activates with the assigned role.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
        >
          <MailPlus size={14} aria-hidden="true" /> Invite admin
        </button>
      </div>

      {notice && (
        <p role="status" className="surface-card border-gold/25 bg-gold-dim/40 p-4 text-[12.5px] text-gold-light">
          {notice}
        </p>
      )}

      <InviteDialog
        open={inviteOpen}
        roles={roles}
        onClose={() => setInviteOpen(false)}
        onDone={async (msg) => {
          setInviteOpen(false);
          setNotice(msg);
          await onReload();
          onChanged?.();
        }}
      />

      <div className="surface-card divide-y divide-white/[0.04] overflow-hidden">
        {users.length === 0 && (
          <p className="p-8 text-center text-[12.5px] text-muted-foreground">No administrators match.</p>
        )}
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-white/[0.02]">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim font-display text-[13px] font-bold text-gold"
              aria-hidden="true"
            >
              {(u.name ?? u.email).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[13.5px] font-medium text-foreground">{u.name ?? u.email}</p>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{u.email}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5">
                  <ShieldCheck size={10} className="text-gold" aria-hidden="true" />
                  {roleLabel(u.roleKey)}
                </span>
                {u.status === "invited" && u.inviteExpiresAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={10} aria-hidden="true" />
                    expires {timeAgo(u.inviteExpiresAt)}
                  </span>
                )}
                {u.lastLoginAt ? (
                  <span>last seen {timeAgo(u.lastLoginAt)}</span>
                ) : (
                  <span>never signed in</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
                  STATUS_STYLES[u.status] ?? "border-white/[0.08] text-muted-foreground"
                )}
              >
                {u.status}
              </span>
              {u.status === "invited" && (
                <button
                  disabled={busyId === u.id}
                  onClick={() => void patch(u.id, { resendInvite: true }, `Invitation resent to ${u.email}.`)}
                  aria-label={`Resend invitation to ${u.email}`}
                  title="Resend invitation"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground transition-colors hover:text-gold disabled:opacity-50"
                >
                  {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} aria-hidden="true" />}
                </button>
              )}
              {u.status !== "invited" && (
                <button
                  disabled={busyId === u.id}
                  onClick={() =>
                    void patch(
                      u.id,
                      { status: u.status === "disabled" ? "active" : "disabled" },
                      u.status === "disabled" ? `${u.email} re-enabled.` : `${u.email} disabled — sessions revoked.`
                    )
                  }
                  aria-label={u.status === "disabled" ? `Re-enable ${u.email}` : `Disable ${u.email}`}
                  title={u.status === "disabled" ? "Re-enable" : "Disable (revokes sessions)"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground transition-colors hover:text-gold disabled:opacity-50"
                >
                  {u.status === "disabled" ? (
                    <BadgeCheck size={14} aria-hidden="true" />
                  ) : (
                    <Ban size={14} aria-hidden="true" />
                  )}
                </button>
              )}
              <RoleSelect
                roles={roles}
                value={u.roleKey}
                disabled={busyId === u.id}
                onSelect={(roleKey) => void patch(u.id, { roleKey }, `${u.email} is now ${roleLabel(roleKey)}.`)}
              />
              {u.status !== "invited" && (
                <button
                  disabled={busyId === u.id}
                  onClick={() => void remove(u.id)}
                  aria-label={`Remove ${u.email}`}
                  title="Remove administrator"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground transition-colors hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleSelect({
  roles,
  value,
  disabled,
  onSelect,
}: {
  roles: AdminRoleRow[];
  value: string;
  disabled: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onSelect(e.target.value)}
      aria-label="Change role"
      title="Change role"
      className="h-9 rounded-xl border border-white/[0.09] bg-white/[0.03] px-2.5 text-[11.5px] text-foreground outline-none focus:border-gold/60 disabled:opacity-50"
    >
      {roles.map((r) => (
        <option key={r.key} value={r.key} className="bg-background text-foreground">
          {r.label}
        </option>
      ))}
    </select>
  );
}

/* ── Invite dialog (§44) ─────────────────────────────────────────── */

function InviteDialog({
  open,
  roles,
  onClose,
  onDone,
}: {
  open: boolean;
  roles: AdminRoleRow[];
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleKey, setRoleKey] = useState("support_agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
      setRoleKey(roles.find((r) => r.key !== "super_admin")?.key ?? "support_agent");
      setError(null);
    }
  }, [open, roles]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, roleKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Invite failed");
      onDone(`Invitation sent to ${email}. They'll activate via the link in the email.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite administrator"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <form onSubmit={submit} className="surface-card w-full max-w-md p-6 md:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
            <MailPlus size={16} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[15.5px] font-semibold text-foreground">Invite an administrator</h3>
            <p className="text-[11.5px] text-muted-foreground">They receive an activation link by email.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="invite-email" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@okomba.com"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
          </div>
          <div>
            <label htmlFor="invite-name" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Name (optional)
            </label>
            <input
              id="invite-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ngozi Eze"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Role & capabilities
            </label>
            <select
              id="invite-role"
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13.5px] text-foreground outline-none focus:border-gold/60"
            >
              {roles.map((r) => (
                <option key={r.key} value={r.key} className="bg-background text-foreground">
                  {r.label} {r.key === "super_admin" ? "(unrestricted)" : ""}
                </option>
              ))}
            </select>
            {roles.find((r) => r.key === roleKey) && (
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {roles.find((r) => r.key === roleKey)!.description} —{" "}
                {(roles.find((r) => r.key === roleKey)!.permissions as string[]).length} capabilities
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12px] text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[13px] font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <MailPlus size={14} aria-hidden="true" />}
            {busy ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Roles panel (§44/§45 configurable capabilities) ─────────────── */

function RolesPanel({ roles, onReload }: { roles: AdminRoleRow[]; onReload: () => Promise<void> | void }) {
  const [editing, setEditing] = useState<AdminRoleRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-[14.5px] font-semibold text-foreground">Roles & capabilities</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            §45 — every admin route enforces these capabilities server-side. Super Admin is unrestricted by design.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-dim px-4 py-2.5 text-[13px] font-semibold text-gold transition-colors hover:border-gold/60"
        >
          <PencilLine size={14} aria-hidden="true" /> Custom role
        </button>
      </div>

      {notice && (
        <p role="status" className="surface-card border-gold/25 bg-gold-dim/40 p-4 text-[12.5px] text-gold-light">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {roles.map((r) => (
          <div key={r.key} className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-foreground">{r.label}</h3>
                  {r.key === "super_admin" && (
                    <span className="rounded-full border border-gold/30 bg-gold-dim px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-gold">
                      unrestricted
                    </span>
                  )}
                  {!r.isSystem && (
                    <span className="rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-teal">
                      custom
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[12px] text-muted-foreground">{r.description}</p>
              </div>
              {r.key !== "super_admin" && (
                <button
                  onClick={() => setEditing(r)}
                  aria-label={`Edit ${r.label} capabilities`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-muted-foreground transition-colors hover:text-gold"
                >
                  <UserCog size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {(r.permissions as string[]).map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {PERMISSIONS.find((pp) => pp.key === p)?.label ?? p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <RoleEditorDialog
          role={creating ? null : editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={async (msg) => {
            setEditing(null);
            setCreating(false);
            setNotice(msg);
            await onReload();
          }}
        />
      )}
    </div>
  );
}

function RoleEditorDialog({
  role,
  onClose,
  onSaved,
}: {
  role: AdminRoleRow | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const isEdit = role !== null;
  const [label, setLabel] = useState(role?.label ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>((role?.permissions as string[]) ?? ["view_dashboard"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setLabel(role.label);
      setDescription(role.description);
      setPermissions((role.permissions as string[]) ?? []);
    }
  }, [role]);

  const toggle = (key: string) => {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (permissions.length === 0) throw new Error("Grant at least one capability");
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/admin/roles/${role!.key}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, description, permissions }),
        });
      } else {
        const key = label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 40) || "custom_role";
        res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, label, description, permissions }),
        });
      }
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      onSaved(isEdit ? `${label} capabilities updated.` : `Custom role "${label}" created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? `Edit ${role!.label}` : "Create custom role"}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <form onSubmit={submit} className="surface-card my-8 w-full max-w-lg p-6 md:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
            <UserCog size={16} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[15.5px] font-semibold text-foreground">
              {isEdit ? `Edit ${role!.label}` : "Create a custom role"}
            </h3>
            <p className="text-[11.5px] text-muted-foreground">Capabilities apply on the server, immediately.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="role-label" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Role name
            </label>
            <input
              id="role-label"
              required
              minLength={2}
              maxLength={60}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Operations"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
          </div>
          <div>
            <label htmlFor="role-desc" className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Description
            </label>
            <input
              id="role-desc"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role is for"
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/60"
            />
          </div>
          <fieldset>
            <legend className="mb-2 block text-[12.5px] font-medium text-muted-foreground">
              Capabilities ({permissions.length} granted)
            </legend>
            <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-white/[0.07] p-3">
              {PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-[12.5px] text-foreground">{p.label}</span>
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => toggle(p.key)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12px] text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-4 py-2.5 text-[13px] font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {busy ? "Saving…" : isEdit ? "Save capabilities" : "Create role"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Audit log panel (§44) ───────────────────────────────────────── */

function AuditPanel({ entries, total }: { entries: AdminAuditRow[]; total: number }) {
  if (entries.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <History size={20} className="mx-auto text-muted-foreground/50" aria-hidden="true" />
        <p className="mt-3 text-[12.5px] text-muted-foreground">No admin actions recorded yet.</p>
      </div>
    );
  }
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-white/[0.05] p-4">
        <h2 className="text-[13.5px] font-semibold text-foreground">Recent admin activity</h2>
        <p className="text-[11.5px] text-muted-foreground">{total} events recorded — newest first</p>
      </div>
      <ul className="max-h-[560px] divide-y divide-white/[0.04] overflow-y-auto">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 p-3.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-foreground">
                <span className="font-medium">{e.actorEmail}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {ACTION_LABELS[e.action] ?? e.action}
                </span>
              </p>
              <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground/70">
                {new Date(e.createdAt).toLocaleString()} · {e.action}
                {e.targetType ? ` · ${e.targetType}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
