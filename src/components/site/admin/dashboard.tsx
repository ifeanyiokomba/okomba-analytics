"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  CreditCard,
  FileSignature,
  FileText,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareQuote,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OkombaLogo } from "../logo";
import type { Post } from "@/lib/posts";
import type { Testimonial } from "@/lib/testimonials";
import type { Service } from "@/lib/content";
import { ServiceDetailDialog } from "./service-detail-dialog";
import { InquiryDetailDialog } from "./inquiry-detail-dialog";
import { PostEditorDialog } from "./post-editor-dialog";
import { AuthorsDialog } from "./authors-dialog";
import { TestimonialEditorDialog } from "./testimonial-editor-dialog";
import { BroadcastDialog } from "./broadcast-dialog";
import { OverviewTab } from "./overview-tab";
import { InquiriesTab } from "./inquiries-tab";
import { SubscribersTab } from "./subscribers-tab";
import { PostsTab } from "./posts-tab";
import { CommentsTab, type AdminComment } from "./comments-tab";
import { AdsTab, type AdRequestRow, type AdStats } from "./ads-tab";
import { AdDetailDialog } from "./ad-detail-dialog";
import { TestimonialsTab } from "./testimonials-tab";
import { EmailLogTab } from "./email-log-tab";
import { InvoicesTab } from "./invoices-tab";
import { CustomersTab } from "./customers-tab";
import { WhatsAppTab } from "./whatsapp-tab";
import { PaymentsTab } from "./payments-tab";
import { AnalyticsTab } from "./analytics-tab";
import { SettingsTab } from "./settings-tab";
import { AdminsTab } from "./admins-tab";
import { QuickAddCustomerDialog } from "./quick-add-customer-dialog";
import { ProposalComposerDialog } from "./proposal-composer-dialog";
import type {
  DraftProposalRow,
  EmailLog,
  Inquiry,
  Invoice,
  Stats,
  Subscriber,
  WhatsAppServiceStatus,
} from "./types";

type Tab =
  | "overview"
  | "inquiries"
  | "customers"
  | "proposals"
  | "payments"
  | "analytics"
  | "subscribers"
  | "posts"
  | "comments"
  | "ads"
  | "admins"
  | "testimonials"
  | "whatsapp"
  | "email"
  | "settings";

const TABS: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inquiries", label: "Inquiries", icon: Inbox },
  { id: "customers", label: "CRM", icon: Users },
  { id: "proposals", label: "Proposals", icon: FileSignature },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "admins", label: "Admins", icon: ShieldCheck },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "email", label: "Email log", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminDashboard({
  onLogout,
  onExit,
}: {
  onLogout: () => void;
  onExit: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  // Data
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [showAuthors, setShowAuthors] = useState(false);

  /* ── BATCH 6: advertising requests (§40) ── */
  const [ads, setAds] = useState<AdRequestRow[]>([]);
  const [adStats, setAdStats] = useState<AdStats | null>(null);
  const [detailAd, setDetailAd] = useState<AdRequestRow | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drafts, setDrafts] = useState<DraftProposalRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState<null | "draft" | "scheduled" | "published">(null);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);

  // Dialogs
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<Inquiry | null>(null);
  const [editingPost, setEditingPost] = useState<{ post: Post | null; mode: "create" | "edit" } | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<
    { testimonial: Testimonial | null; mode: "create" | "edit" } | null
  >(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [composing, setComposing] = useState<Inquiry | null>(null);
  const [composingDraft, setComposingDraft] = useState<DraftProposalRow | null>(null);

  // Toast (simple inline notification for action feedback)
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((text: string, type: "ok" | "err" = "ok") => {
    setToast({ text, type });
  }, []);

  /* ── WhatsApp live status (Module 6) ─────────────────── */
  const [waStatus, setWaStatus] = useState<WhatsAppServiceStatus | null>(null);
  const prevWaRef = useRef<WhatsAppServiceStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/api/admin/whatsapp/status");
        if (!res.ok) return;
        const j = await res.json();
        const s = (j.status ?? null) as WhatsAppServiceStatus | null;
        if (!alive || !s) return;
        const prev = prevWaRef.current;
        prevWaRef.current = s;
        setWaStatus(s);
        // Spec toast: session drop → "WhatsApp disconnected. Scan QR again"
        if (prev?.status === "connected" && s.status === "disconnected") {
          setToast({ text: "WhatsApp disconnected. Scan QR again", type: "err" });
        }
      } catch {
        /* service offline — badge shows "No service" */
      }
    };
    void check();
    const t = setInterval(check, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  /* ── BATCH 7 (§44): signed-in admin identity + permissions ── */
  const [me, setMe] = useState<{
    email: string;
    name: string | null;
    roleLabel: string;
    roleKey: string;
    isMaster: boolean;
    permissions: string[];
  } | null>(null);
  const [inquiryFocus, setInquiryFocus] = useState<string | undefined>(undefined);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const can = useCallback(
    (perm: string) => Boolean(me?.isMaster || me?.permissions.includes(perm)),
    [me]
  );

  const visibleTabs = useMemo(
    () => TABS.filter((t) => (t.id === "admins" ? can("manage_admins") : true)),
    [can]
  );

  /* ── Data loader ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setError(null);
    try {
      const [meRes, listRes, statsRes, subsRes, postsRes, logRes, testimonialsRes, invoicesRes, draftsRes, commentsRes, adsRes] = await Promise.all([
        fetch("/api/admin/me"),
        fetch("/api/inquiries"),
        fetch("/api/inquiries?stats=1"),
        fetch("/api/subscribers"),
        fetch("/api/admin/posts"),
        fetch("/api/admin/email-log?limit=50"),
        fetch("/api/admin/testimonials"),
        fetch("/api/admin/invoices"),
        fetch("/api/admin/proposal-drafts"),
        fetch("/api/admin/comments"),
        fetch("/api/admin/ads?stats=1"),
      ]);
      if (meRes.ok) {
        const m = (await meRes.json()) as { me?: {
          email: string;
          name: string | null;
          roleLabel: string;
          roleKey: string;
          isMaster: boolean;
          permissions: string[];
        } };
        setMe(m.me ?? null);
      }
      if (!listRes.ok || !statsRes.ok) throw new Error("Failed to load data — session may have expired");
      const list = await listRes.json();
      const s = await statsRes.json();
      setInquiries(list.inquiries ?? []);
      setStats(s.stats ?? null);

      if (subsRes.ok) {
        const subs = await subsRes.json();
        setSubscribers(subs.subscribers ?? []);
      }
      if (postsRes.ok) {
        const p = await postsRes.json();
        setPosts(p.posts ?? []);
      }
      if (commentsRes.ok) {
        const c = await commentsRes.json();
        setComments(c.comments ?? []);
      }
      if (adsRes.ok) {
        const a = await adsRes.json();
        setAds(a.ads ?? []);
        setAdStats(a.stats ?? null);
      }
      if (logRes.ok) {
        const l = await logRes.json();
        setEmailLogs(l.logs ?? []);
      }
      if (testimonialsRes.ok) {
        const tm = await testimonialsRes.json();
        setTestimonials(tm.testimonials ?? []);
      }
      if (invoicesRes.ok) {
        const inv = await invoicesRes.json();
        setInvoices(inv.invoices ?? []);
      }
      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setDrafts(d.drafts ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Action handlers ─────────────────────────────────────── */
  const updateInquiryStatus = useCallback(
    async (id: string, status: string) => {
      setUpdatingId(id);
      try {
        const res = await fetch("/api/inquiries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error("Update failed");
        setToast({ text: `Inquiry marked ${status.replace("_", " ")}`, type: "ok" });
        await load();
      } catch {
        setError("Could not update status. Please refresh.");
        setToast({ text: "Status update failed", type: "err" });
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  const updateSubscriberStatus = useCallback(
    async (id: string, status: string) => {
      setUpdatingId(id);
      try {
        const res = await fetch("/api/admin/subscribers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error("Update failed");
        setToast({ text: `Subscriber marked ${status}`, type: "ok" });
        await load();
      } catch {
        setToast({ text: "Subscriber update failed", type: "err" });
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  const deleteSubscriber = useCallback(
    async (id: string) => {
      setUpdatingId(id);
      try {
        const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setToast({ text: "Subscriber removed", type: "ok" });
        await load();
      } catch {
        setToast({ text: "Subscriber delete failed", type: "err" });
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  const savePost = useCallback(
    async (data: {
      id?: string;
      title: string;
      slug?: string;
      excerpt: string;
      content: string;
      category: string;
      tags: string[];
      author: string;
      status: "draft" | "scheduled" | "published";
      authorId?: string | null;
      coverImageUrl?: string | null;
      attachments?: { name: string; url: string; bytes: number; mime: string; kind: string }[];
      seoTitle?: string | null;
      seoDescription?: string | null;
      socialImageUrl?: string | null;
      scheduledAt?: string | null;
      notifyPlanned?: boolean;
      notifySegment?: "all" | "recent90";
    }): Promise<void> => {
      setSavingPost(data.status);
      try {
        const isEdit = !!data.id;
        const res = await fetch("/api/admin/posts", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error ?? "Save failed");
        }
        if (data.status === "published" && !isEdit) {
          setToast({ text: data.notifyPlanned === false ? "Post published" : "Post published — subscribers notified", type: "ok" });
        } else if (data.status === "published" && isEdit) {
          setToast({ text: "Post updated & published", type: "ok" });
        } else if (data.status === "scheduled") {
          setToast({ text: "Post scheduled — it will publish automatically", type: "ok" });
        } else if (isEdit) {
          setToast({ text: "Post updated", type: "ok" });
        } else {
          setToast({ text: "Draft saved", type: "ok" });
        }
        await load();
      } catch (err) {
        setToast({
          text: err instanceof Error ? err.message : "Save failed",
          type: "err",
        });
        throw err;
      } finally {
        setSavingPost(null);
      }
    },
    [load]
  );

  /* ── BATCH 5 (§23/§92): comment moderation handlers ────── */
  const moderateComment = useCallback(
    async (id: string, action: "approve" | "reject" | "spam" | "pending") => {
      setCommentBusyId(id);
      try {
        const res = await fetch("/api/admin/comments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        if (!res.ok) throw new Error("Moderation failed");
        setToast({
          text:
            action === "approve"
              ? "Comment approved — now public"
              : action === "spam"
                ? "Comment marked as spam"
                : action === "reject"
                  ? "Comment rejected"
                  : "Comment back in the review queue",
          type: "ok",
        });
        const refreshed = await fetch("/api/admin/comments");
        if (refreshed.ok) {
          const j = await refreshed.json();
          setComments(j.comments ?? []);
        }
      } catch (err) {
        setToast({ text: err instanceof Error ? err.message : "Moderation failed", type: "err" });
      } finally {
        setCommentBusyId(null);
      }
    },
    []
  );

  const deleteComment = useCallback(
    async (id: string) => {
      setCommentBusyId(id);
      try {
        const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setToast({ text: "Comment deleted", type: "ok" });
        setComments((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setToast({ text: err instanceof Error ? err.message : "Delete failed", type: "err" });
      } finally {
        setCommentBusyId(null);
      }
    },
    []
  );

  /* ── BATCH 6: ad request management (§38/§40) ────────────── */
  const refreshAds = useCallback(async () => {
    const refreshed = await fetch("/api/admin/ads?stats=1");
    if (refreshed.ok) {
      const j = await refreshed.json();
      setAds(j.ads ?? []);
      setAdStats(j.stats ?? null);
      return j.ads ?? [];
    }
    return null;
  }, []);

  const updateAd = useCallback(
    async (id: string, patch: Record<string, unknown>): Promise<boolean> => {
      setAdBusy(true);
      try {
        const res = await fetch(`/api/admin/ads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error ?? "Update failed");
        const status = patch.status as string | undefined;
        setToast({
          text:
            status === "approved"
              ? "Approved — pricing & payment instructions emailed"
              : status === "awaiting_customer"
                ? "Clarification request emailed"
                : status === "rejected"
                  ? "Request rejected — notice emailed"
                  : status === "scheduled"
                    ? "Campaign scheduled — goes live automatically"
                    : status === "active"
                      ? "Campaign live"
                      : status === "paused"
                        ? "Campaign paused"
                        : patch.paymentStatus === "paid"
                          ? "Payment recorded — receipt emailed"
                          : "Ad request updated",
          type: "ok",
        });
        const fresh = await refreshAds();
        if (fresh) {
          const updated = (fresh as AdRequestRow[]).find((a) => a.id === id);
          if (updated) setDetailAd(updated);
        }
        return true;
      } catch (err) {
        setToast({ text: err instanceof Error ? err.message : "Update failed", type: "err" });
        return false;
      } finally {
        setAdBusy(false);
      }
    },
    [refreshAds]
  );

  const uploadAdCreative = useCallback(
    async (id: string, file: File): Promise<boolean> => {
      setAdBusy(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/admin/ads/${id}/creative`, { method: "POST", body: form });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error ?? "Upload failed");
        setToast({ text: "Creative uploaded", type: "ok" });
        const fresh = await refreshAds();
        if (fresh) {
          const updated = (fresh as AdRequestRow[]).find((a) => a.id === id);
          if (updated) setDetailAd(updated);
        }
        return true;
      } catch (err) {
        setToast({ text: err instanceof Error ? err.message : "Upload failed", type: "err" });
        return false;
      } finally {
        setAdBusy(false);
      }
    },
    [refreshAds]
  );

  const deleteAd = useCallback(
    async (id: string) => {
      setAdBusy(true);
      try {
        const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setToast({ text: "Ad request deleted", type: "ok" });
        setDetailAd(null);
        await refreshAds();
      } catch (err) {
        setToast({ text: err instanceof Error ? err.message : "Delete failed", type: "err" });
      } finally {
        setAdBusy(false);
      }
    },
    [refreshAds]
  );

  const deletePost = useCallback(
    async (post: Post) => {
      setDeletingPostId(post.id);
      try {
        const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setToast({ text: "Post deleted", type: "ok" });
        await load();
      } catch {
        setToast({ text: "Delete failed", type: "err" });
      } finally {
        setDeletingPostId(null);
      }
    },
    [load]
  );

  const saveTestimonial = useCallback(
    async (data: {
      id?: string;
      name: string;
      role: string;
      service: string;
      text: string;
      rating: number;
      avatar?: string;
      status: "draft" | "published";
    }): Promise<void> => {
      try {
        const isEdit = !!data.id;
        // Keep the existing position when editing; append after the last row on create
        const sortOrder = isEdit
          ? testimonials.find((t) => t.id === data.id)?.sortOrder ?? 0
          : testimonials.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1;
        const res = await fetch(
          isEdit ? `/api/admin/testimonials/${data.id}` : "/api/admin/testimonials",
          {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, sortOrder }),
          }
        );
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error ?? "Save failed");
        }
        if (data.status === "published") {
          setToast({ text: isEdit ? "Testimonial updated & published" : "Testimonial published", type: "ok" });
        } else {
          setToast({ text: isEdit ? "Testimonial updated" : "Draft saved", type: "ok" });
        }
        await load();
      } catch (err) {
        setToast({
          text: err instanceof Error ? err.message : "Save failed",
          type: "err",
        });
        throw err;
      }
    },
    [load, testimonials]
  );

  const deleteTestimonial = useCallback(
    async (testimonial: Testimonial) => {
      setDeletingTestimonialId(testimonial.id);
      try {
        const res = await fetch(`/api/admin/testimonials/${testimonial.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setToast({ text: "Testimonial deleted", type: "ok" });
        await load();
      } catch {
        setToast({ text: "Delete failed", type: "err" });
      } finally {
        setDeletingTestimonialId(null);
      }
    },
    [load]
  );

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    onLogout();
  };

  /* ── Module 5: manual reminder scan ───────────────────── */
  const [runningReminders, setRunningReminders] = useState(false);
  const runReminders = useCallback(async () => {
    setRunningReminders(true);
    try {
      const res = await fetch("/api/admin/reminders/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Scan failed");
      const r = j.report as {
        sentCount: number;
        skipped: unknown[];
        lagosToday: string;
      };
      notify(
        r.sentCount > 0
          ? `Reminder scan — ${r.sentCount} nudges sent (email + WhatsApp, PDF attached)`
          : `Reminder scan — nothing due today (${r.lagosToday})`,
        "ok"
      );
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Reminder scan failed", "err");
    } finally {
      setRunningReminders(false);
    }
  }, [load, notify]);

  /* ── Module 7: AI-chat draft proposal handlers ──── */
  const openDraft = useCallback(
    (draft: DraftProposalRow) => {
      const inquiry = inquiries.find((i) => i.id === draft.inquiryId) ?? null;
      if (!inquiry) {
        notify("Linked inquiry not found — it may have been removed.", "err");
        return;
      }
      setComposingDraft(draft);
      setComposing(inquiry);
    },
    [inquiries, notify]
  );

  const discardDraft = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/admin/proposal-drafts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Discard failed");
        notify("Draft discarded", "ok");
        await load();
      } catch {
        notify("Could not discard draft", "err");
      }
    },
    [load, notify]
  );

  /* ── Derived data for overview ──────────────────────────── */
  const recentInquiries = useMemo(
    () =>
      inquiries
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map((i) => ({
          id: i.id,
          name: i.name,
          service: i.service,
          createdAt: i.createdAt,
          status: i.status,
        })),
    [inquiries]
  );
  const recentPosts = useMemo(
    () =>
      posts
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6)
        .map((p) => ({ id: p.id, title: p.title, status: p.status, updatedAt: p.updatedAt })),
    [posts]
  );
  const recentEmails = useMemo(
    () =>
      emailLogs
        .slice()
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
        .slice(0, 6)
        .map((e) => ({
          id: e.id,
          type: e.type,
          subject: e.subject,
          recipientEmail: e.recipientEmail,
          sentAt: e.sentAt,
        })),
    [emailLogs]
  );

  const confirmedSubs = subscribers.filter((s) => s.status === "confirmed").length;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="section-dark min-h-screen bg-background">
      {/* Sticky admin header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#05070d]/88 backdrop-blur-xl">
        <div className="container-xl flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <OkombaLogo height={40} priority onDark />
            <span className="hidden rounded-full border border-gold/30 bg-gold-dim px-3 py-1 font-mono text-[10px] text-gold sm:inline-block">
              ADMIN
            </span>
            {/* §44 — signed-in identity chip (role from RBAC) */}
            {me && (
              <span className="hidden items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground md:inline-flex">
                <ShieldCheck size={11} className="text-gold" aria-hidden="true" />
                <span className="max-w-[140px] truncate font-medium text-foreground">{me.name ?? me.email}</span>
                <span className="text-gold">{me.roleLabel}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={load}
              aria-label="Refresh data"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold sm:px-3.5"
            >
              <RefreshCw size={13} aria-hidden="true" /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onExit}
              aria-label="Back to website"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2.5 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3.5"
            >
              <ArrowLeft size={13} aria-hidden="true" /> <span className="hidden sm:inline">Site</span>
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-2.5 py-2 text-[12.5px] font-medium text-red-300 transition-colors hover:bg-red-500/15 sm:px-3.5"
            >
              <LogOut size={13} aria-hidden="true" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs nav */}
      <nav className="sticky top-16 z-30 border-b border-white/[0.06] bg-[#05070d]/75 backdrop-blur-md">
        <div className="container-xl flex items-center gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {visibleTabs.map((t) => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            const badge =
              t.id === "inquiries"
                ? stats?.new
                : t.id === "proposals"
                  ? drafts.filter((d) => d.status === "draft").length
                  : t.id === "subscribers"
                    ? confirmedSubs
                    : t.id === "posts"
                      ? posts.filter((p) => p.status === "draft").length
                      : t.id === "comments"
                        ? comments.filter((c) => c.status === "pending").length
                        : t.id === "ads"
                          ? (adStats?.awaitingAdmin ?? ads.filter((a) => a.status === "new").length)
                          : t.id === "testimonials"
                            ? testimonials.filter((t2) => t2.status === "draft").length
                            : undefined;
            const waDot =
              t.id === "whatsapp" ? (waStatus?.status ?? "unknown") : null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{t.label}</span>
                {waDot && (
                  <span
                    aria-label={`WhatsApp ${waDot}`}
                    title={`WhatsApp ${waDot}`}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      waDot === "connected"
                        ? "bg-teal"
                        : waDot === "connecting"
                          ? "animate-pulse bg-gold"
                          : waDot === "disconnected"
                            ? "bg-red-400"
                            : "bg-white/25"
                    )}
                  />
                )}
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono text-[9.5px] font-semibold",
                      isActive ? "bg-gold/25 text-gold" : "bg-white/[0.06] text-muted-foreground"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="container-xl py-8 md:py-10">
        {/* Toast */}
        {toast && (
          <div
            role="status"
            className={cn(
              "fixed right-4 top-24 z-50 rounded-xl border px-4 py-3 text-[12.5px] font-medium shadow-float [animation:slide-in-right_0.4s_ease]",
              toast.type === "ok"
                ? "border-teal/30 bg-teal-dim text-teal"
                : "border-red-500/30 bg-red-500/15 text-red-300"
            )}
          >
            {toast.text}
          </div>
        )}

        {error && (
          <p role="alert" className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-300">
            {error}
          </p>
        )}

        {/* Tab content */}
        {loading && stats === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-gold" aria-label="Loading dashboard" />
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <OverviewTab
                stats={stats}
                recentInquiries={recentInquiries}
                recentPosts={recentPosts}
                recentEmails={recentEmails}
                me={me}
                outstandingInvoices={invoices.filter(
                  (i) => i.status !== "paid" && i.status !== "void"
                ).length}
                liveAds={adStats?.active ?? ads.filter((a) => a.status === "active").length}
                pendingComments={comments.filter((c) => c.status === "pending").length}
                can={can}
                onNavigate={(target, filter) => {
                  if (target === "inquiries" && filter) {
                    setInquiryFocus(filter);
                  }
                  setTab(target);
                }}
                onQuickAction={(action) => {
                  if (action === "new-customer" || action === "new-inquiry") {
                    setShowQuickAdd(true);
                  } else if (action === "new-post") {
                    setEditingPost({ post: null, mode: "create" });
                  } else if (action === "broadcast") {
                    setShowBroadcast(true);
                  } else if (action === "invite-admin") {
                    setTab("admins");
                  } else if (action === "new-proposal" || action === "review-drafts") {
                    setTab("proposals");
                  } else if (action === "new-invoice") {
                    setTab("payments");
                  } else if (action === "new-ad") {
                    setTab("ads");
                  }
                }}
              />
            )}
            {tab === "inquiries" && (
              <InquiriesTab
                key={inquiryFocus ?? "all"}
                inquiries={inquiries}
                loading={false}
                error={error}
                initialStatus={inquiryFocus}
                onUpdateStatus={updateInquiryStatus}
                updatingId={updatingId}
                onOpenInquiry={(i) => setDetailInquiry(i)}
                onOpenService={(svc) => setDetailService(svc)}
                onCreateProposal={(i) => {
                  setDetailInquiry(null);
                  setComposingDraft(null);
                  setComposing(i);
                }}
              />
            )}
            {tab === "customers" && <CustomersTab />}
            {tab === "proposals" && (
              <InvoicesTab
                invoices={invoices}
                loading={false}
                onCreateFromInquiries={() => setTab("inquiries")}
                onRunReminders={runReminders}
                runningReminders={runningReminders}
                drafts={drafts}
                onOpenDraft={openDraft}
                onDiscardDraft={(id) => void discardDraft(id)}
              />
            )}
            {tab === "payments" && (
              <PaymentsTab invoices={invoices} notify={notify} />
            )}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "subscribers" && (
              <SubscribersTab
                subscribers={subscribers}
                loading={false}
                onUpdateStatus={updateSubscriberStatus}
                onDelete={deleteSubscriber}
                onComposeBroadcast={() => setShowBroadcast(true)}
                updatingId={updatingId}
              />
            )}
            {tab === "posts" && (
              <PostsTab
                posts={posts}
                loading={false}
                onCreateNew={() => setEditingPost({ post: null, mode: "create" })}
                onEdit={(p) => setEditingPost({ post: p, mode: "edit" })}
                onDelete={deletePost}
                deletingId={deletingPostId}
                onManageAuthors={() => setShowAuthors(true)}
              />
            )}
            {tab === "comments" && (
              <CommentsTab
                comments={comments}
                loading={false}
                onModerate={moderateComment}
                onDelete={deleteComment}
                busyId={commentBusyId}
              />
            )}
            {tab === "ads" && (
              <AdsTab ads={ads} stats={adStats} loading={false} onOpen={(a) => setDetailAd(a)} />
            )}
            {tab === "admins" && (
              <AdminsTab
                canManageAdmins={can("manage_admins")}
                onChanged={() => void load()}
              />
            )}
            {tab === "testimonials" && (
              <TestimonialsTab
                testimonials={testimonials}
                loading={false}
                onCreateNew={() => setEditingTestimonial({ testimonial: null, mode: "create" })}
                onEdit={(t) => setEditingTestimonial({ testimonial: t, mode: "edit" })}
                onDelete={deleteTestimonial}
                deletingId={deletingTestimonialId}
              />
            )}
            {tab === "whatsapp" && (
              <WhatsAppTab notify={notify} onMessagesChanged={load} />
            )}
            {tab === "email" && (
              <EmailLogTab logs={emailLogs} loading={false} total={emailLogs.length} />
            )}
            {tab === "settings" && <SettingsTab />}
          </>
        )}
      </main>

      {/* Dialogs */}
      <ServiceDetailDialog service={detailService} onClose={() => setDetailService(null)} />
      <InquiryDetailDialog
        inquiry={detailInquiry}
        onClose={() => setDetailInquiry(null)}
        onOpenService={(svc) => {
          setDetailInquiry(null);
          setDetailService(svc);
        }}
        onCreateProposal={(i) => {
          setDetailInquiry(null);
          setComposing(i);
        }}
      />
      {editingPost && (
        <PostEditorDialog
          post={editingPost.post}
          mode={editingPost.mode}
          onClose={() => setEditingPost(null)}
          onSave={savePost}
        />
      )}
      {showAuthors && (
        <AuthorsDialog
          onClose={() => setShowAuthors(false)}
          onChanged={load}
        />
      )}
      {editingTestimonial && (
        <TestimonialEditorDialog
          testimonial={editingTestimonial.testimonial}
          mode={editingTestimonial.mode}
          onClose={() => setEditingTestimonial(null)}
          onSave={saveTestimonial}
        />
      )}
      {showBroadcast && (
        <BroadcastDialog
          subscriberCount={confirmedSubs}
          onClose={() => setShowBroadcast(false)}
          onSent={(sent) => {
            setToast({
              text: `Broadcast sent to ${sent} subscriber${sent === 1 ? "" : "s"}`,
              type: "ok",
            });
            load();
          }}
        />
      )}
      {/* §47 quick action — New customer / New inquiry (quick-add) */}
      {showQuickAdd && (
        <QuickAddCustomerDialog
          onClose={() => setShowQuickAdd(false)}
          onSaved={() => {
            setShowQuickAdd(false);
            setToast({ text: "Customer created", type: "ok" });
            load();
          }}
        />
      )}
      {detailAd && (
        <AdDetailDialog
          key={`${detailAd.id}:${detailAd.updatedAt}`}
          ad={detailAd}
          busy={adBusy}
          onClose={() => setDetailAd(null)}
          onUpdate={updateAd}
          onUploadCreative={uploadAdCreative}
          onDelete={deleteAd}
        />
      )}
      <ProposalComposerDialog
        inquiry={composing}
        preloadedDraft={composingDraft?.draft ?? null}
        draftProposalId={composingDraft?.id ?? null}
        onClose={() => {
          setComposing(null);
          setComposingDraft(null);
        }}
        onSent={({ invoiceNumber, emailSent }) => {
          setComposing(null);
          setToast({
            text: emailSent
              ? `Proposal ${invoiceNumber} sent — PDF attached`
              : `Proposal ${invoiceNumber} saved (email failed — see Email log)`,
            type: emailSent ? "ok" : "err",
          });
          load();
          setTab("proposals");
        }}
      />
    </div>
  );
}
