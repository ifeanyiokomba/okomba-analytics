import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────────
   BATCH 7 (§44–47) — Multi-admin RBAC core (SERVER-ONLY).

   §44 Multi-admin: master admin (env ADMIN_EMAIL) invites additional
   admins; invitees accept via token + set a password → account
   activates. Authorization is enforced SERVER-SIDE in every admin
   route (see authorizeAdmin in admin-auth.ts) — never only via
   hidden UI.

   §45 Permissions: the directive's 15 + view_dashboard as a
   observability baseline granted to every role. super_admin (and the
   env master) are unrestricted. Role capabilities are configurable
   through the role editor (AdminRole.permissions Json).
   ───────────────────────────────────────────────────────────────── */

/* §45 — canonical permission vocabulary */
export const ADMIN_PERMISSIONS = [
  "view_dashboard",
  "view_customers",
  "edit_customers",
  "import_customers",
  "view_invoices",
  "create_invoices",
  "manage_payments",
  "manage_posts",
  "moderate_comments",
  "manage_ads",
  "broadcast_subscribers",
  "access_ai",
  "manage_events",
  "manage_students",
  "manage_admins",
  "manage_settings",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  view_dashboard: "View dashboard & analytics",
  view_customers: "View customers",
  edit_customers: "Edit customers",
  import_customers: "Import customers",
  view_invoices: "View invoices & proposals",
  create_invoices: "Create invoices & proposals",
  manage_payments: "Manage payments",
  manage_posts: "Manage posts & media",
  moderate_comments: "Moderate comments",
  manage_ads: "Manage ads",
  broadcast_subscribers: "Broadcast to subscribers",
  access_ai: "Access AI assistance",
  manage_events: "Manage events",
  manage_students: "Manage students",
  manage_admins: "Manage administrators",
  manage_settings: "Manage settings & backups",
};

/* §44 — role catalogue (capabilities editable after seed) */
export const SYSTEM_ROLES: {
  key: string;
  label: string;
  description: string;
  permissions: AdminPermission[];
}[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Unrestricted management — every capability, including admins and settings.",
    permissions: [...ADMIN_PERMISSIONS],
  },
  {
    key: "administrator",
    label: "Administrator",
    description: "Full operations access: CRM, invoices, payments, content, ads — without admin/setting management.",
    permissions: [
      "view_dashboard",
      "view_customers",
      "edit_customers",
      "import_customers",
      "view_invoices",
      "create_invoices",
      "manage_payments",
      "manage_posts",
      "moderate_comments",
      "manage_ads",
      "broadcast_subscribers",
      "access_ai",
      "manage_events",
      "manage_students",
    ],
  },
  {
    key: "finance",
    label: "Finance",
    description: "Invoices, payments and revenue operations.",
    permissions: ["view_dashboard", "view_customers", "view_invoices", "create_invoices", "manage_payments"],
  },
  {
    key: "crm_manager",
    label: "CRM Manager",
    description: "Customer records, imports and sales follow-up.",
    permissions: ["view_dashboard", "view_customers", "edit_customers", "import_customers", "view_invoices", "access_ai"],
  },
  {
    key: "content_manager",
    label: "Content Manager",
    description: "Publishing, moderation and subscriber broadcasts.",
    permissions: ["view_dashboard", "manage_posts", "moderate_comments", "broadcast_subscribers"],
  },
  {
    key: "support_agent",
    label: "Support Agent",
    description: "Read-only view of customers and invoices for support triage.",
    permissions: ["view_dashboard", "view_customers", "view_invoices"],
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Ads, broadcasts and audience insight.",
    permissions: ["view_dashboard", "view_customers", "broadcast_subscribers", "manage_ads"],
  },
  {
    key: "education_manager",
    label: "Education Manager",
    description: "Events, students and educational offerings.",
    permissions: ["view_dashboard", "view_customers", "manage_events", "manage_students"],
  },
];

export const MASTER_ROLE_KEY = "super_admin";

/* ── Passwords: scrypt (node:crypto — no external dependency) ──── */

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/* ── Invitations (§44) ─────────────────────────────────────────── */

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function newInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf-8").digest("hex");
}

/* ── Role resolution ───────────────────────────────────────────── */

export type AdminRoleRecord = {
  key: string;
  label: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
};

export function permissionsForRole(role: AdminRoleRecord | null, masterEmail: string | null, actorEmail: string): string[] {
  if (masterEmail && actorEmail.toLowerCase() === masterEmail.toLowerCase()) {
    return [...ADMIN_PERMISSIONS]; // §45 master admin = unrestricted
  }
  if (!role) return [];
  const perms = Array.isArray(role.permissions) ? (role.permissions as unknown as string[]) : [];
  // super_admin always unrestricted — even if someone edits the role down.
  if (role.key === MASTER_ROLE_KEY) return [...ADMIN_PERMISSIONS];
  return ADMIN_PERMISSIONS.filter((p) => perms.includes(p));
}

/* ── Idempotent seed: roles + master user ───────────────────────── */

let seeded = false;

export async function seedAdminRbac(masterEmail: string, masterName: string | null): Promise<void> {
  if (seeded) return;
  for (const role of SYSTEM_ROLES) {
    // System roles: insert if missing. Existing rows keep their
    // (possibly hand-edited) permissions — configurable §44.
    await db.adminRole.upsert({
      where: { key: role.key },
      create: {
        key: role.key,
        label: role.label,
        description: role.description,
        permissions: role.permissions,
        isSystem: true,
      },
      update: { label: role.label, description: role.description },
    });
  }
  // super_admin is never de-permissioned by edits (enforced in
  // permissionsForRole) — keep the stored row aligned too.
  await db.adminRole.update({
    where: { key: MASTER_ROLE_KEY },
    data: { permissions: [...ADMIN_PERMISSIONS] },
  });

  // Master admin mirrors the env credential into an AdminUser row so
  // the multi-admin list always shows the founder (invitedBy trail).
  await db.adminUser.upsert({
    where: { email: masterEmail.toLowerCase() },
    create: {
      email: masterEmail.toLowerCase(),
      name: masterName ?? "Master Admin",
      roleKey: MASTER_ROLE_KEY,
      status: "active",
      invitedBy: "system",
    },
    update: { roleKey: MASTER_ROLE_KEY, status: "active" },
  });
  seeded = true;
}

/* ── Audit trail (§44 "Audit log") ─────────────────────────────── */

export async function auditAdmin(input: {
  actorEmail: string;
  actorRole?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorEmail: input.actorEmail,
        actorRole: input.actorRole ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        meta: (input.meta ?? undefined) as never,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    // Audit must never break the request it observes.
    console.error("[auditAdmin]", err);
  }
}

export function rbacClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
