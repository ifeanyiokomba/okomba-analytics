"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageSquareQuote,
  RefreshCw,
  Send,
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
import { TestimonialEditorDialog } from "./testimonial-editor-dialog";
import { BroadcastDialog } from "./broadcast-dialog";
import { OverviewTab } from "./overview-tab";
import { InquiriesTab } from "./inquiries-tab";
import { SubscribersTab } from "./subscribers-tab";
import { PostsTab } from "./posts-tab";
import { TestimonialsTab } from "./testimonials-tab";
import { EmailLogTab } from "./email-log-tab";
import type { EmailLog, Inquiry, Stats, Subscriber } from "./types";

type Tab = "overview" | "inquiries" | "subscribers" | "posts" | "testimonials" | "email";

const TABS: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inquiries", label: "Inquiries", icon: Inbox },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "email", label: "Email log", icon: Mail },
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
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState<null | "draft" | "published">(null);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);

  // Dialogs
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<Inquiry | null>(null);
  const [editingPost, setEditingPost] = useState<{ post: Post | null; mode: "create" | "edit" } | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<
    { testimonial: Testimonial | null; mode: "create" | "edit" } | null
  >(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Toast (simple inline notification for action feedback)
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Data loader ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setError(null);
    try {
      const [listRes, statsRes, subsRes, postsRes, logRes, testimonialsRes] = await Promise.all([
        fetch("/api/inquiries"),
        fetch("/api/inquiries?stats=1"),
        fetch("/api/subscribers"),
        fetch("/api/admin/posts"),
        fetch("/api/admin/email-log?limit=50"),
        fetch("/api/admin/testimonials"),
      ]);
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
      if (logRes.ok) {
        const l = await logRes.json();
        setEmailLogs(l.logs ?? []);
      }
      if (testimonialsRes.ok) {
        const tm = await testimonialsRes.json();
        setTestimonials(tm.testimonials ?? []);
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
      status: "draft" | "published";
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
          setToast({ text: "Post published — subscribers notified", type: "ok" });
        } else if (data.status === "published" && isEdit) {
          setToast({ text: "Post updated & published", type: "ok" });
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
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            const badge =
              t.id === "inquiries"
                ? stats?.new
                : t.id === "subscribers"
                  ? confirmedSubs
                  : t.id === "posts"
                    ? posts.filter((p) => p.status === "draft").length
                    : t.id === "testimonials"
                      ? testimonials.filter((t2) => t2.status === "draft").length
                      : undefined;
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
              />
            )}
            {tab === "inquiries" && (
              <InquiriesTab
                inquiries={inquiries}
                loading={false}
                error={error}
                onUpdateStatus={updateInquiryStatus}
                updatingId={updatingId}
                onOpenInquiry={(i) => setDetailInquiry(i)}
                onOpenService={(svc) => setDetailService(svc)}
              />
            )}
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
            {tab === "email" && (
              <EmailLogTab logs={emailLogs} loading={false} total={emailLogs.length} />
            )}
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
      />
      {editingPost && (
        <PostEditorDialog
          post={editingPost.post}
          mode={editingPost.mode}
          onClose={() => setEditingPost(null)}
          onSave={savePost}
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
    </div>
  );
}
