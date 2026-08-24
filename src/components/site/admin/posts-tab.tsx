"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_STATUSES,
  POST_STATUS_STYLES,
  formatDate,
  readTimeFor,
  type Post,
} from "./types";

/* Posts tab — full CMS-style management.
   - List all posts (drafts first, then published)
   - Create / edit (opens PostEditorDialog)
   - Delete (with inline confirm)
   - Filter by status + search by title/slug */
export function PostsTab({
  posts,
  loading,
  onCreateNew,
  onEdit,
  onDelete,
  deletingId,
}: {
  posts: Post[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => Promise<void>;
  deletingId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts
      .filter((p) => {
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        if (!matchesStatus) return false;
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // drafts first, then by updatedAt desc
        if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [posts, search, statusFilter]);

  const draftCount = posts.filter((p) => p.status === "draft").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const notifiedCount = posts.filter((p) => p.notifySentAt).length;

  return (
    <div className="space-y-4">
      {/* Top row: KPIs + New post */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <PostsStatCard label="Total posts" value={posts.length} icon={FileText} accent="text-gold" bg="border-gold/25 bg-gold-dim" />
        <PostsStatCard label="Published" value={publishedCount} icon={Send} accent="text-teal" bg="border-teal/25 bg-teal-dim" />
        <PostsStatCard label="Drafts" value={draftCount} icon={Pencil} accent="text-purple-300" bg="border-purple-400/25 bg-purple-400/10" />
        <PostsStatCard label="Subscriber blasts" value={notifiedCount} icon={Send} accent="text-gold-light" bg="border-gold-light/25 bg-gold-light/10" />
      </div>

      {/* New post banner */}
      <div className="surface-card relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/[0.08] blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold shadow-gold">
            <Plus size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold text-foreground">Write a new post</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Compose in Markdown. Save as draft for later, or publish and email every confirmed subscriber automatically.
            </p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="btn-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
        >
          <Plus size={13} aria-hidden="true" />
          New post
        </button>
      </div>

      {/* Posts list */}
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[14.5px] font-semibold text-foreground">
            All posts{" "}
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              ({filtered.length}
              {filtered.length !== posts.length ? ` of ${posts.length}` : ""})
            </span>
          </h2>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, slug, category…"
                aria-label="Search posts"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] py-2.5 pl-9 pr-3.5 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60 sm:w-72"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {["all", ...POST_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "border-gold/50 bg-gold-dim text-gold"
                      : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading posts" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText size={28} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              No posts yet — click <span className="font-medium text-foreground">New post</span> to write your first.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search size={24} className="text-muted-foreground/40" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">No posts match your search.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.025] sm:flex-row sm:items-start sm:justify-between"
              >
                <button
                  onClick={() => onEdit(p)}
                  className="group flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors group-hover:border-gold/30 group-hover:text-gold">
                    <FileText size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                          POST_STATUS_STYLES[p.status] ?? POST_STATUS_STYLES.draft
                        )}
                      >
                        {p.status}
                      </span>
                      {p.notifySentAt && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal-dim px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-teal">
                          <Send size={8} aria-hidden="true" /> Notified
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground/70">
                        <CalendarDays size={11} aria-hidden="true" />
                        {p.publishedAt
                          ? `Published ${formatDate(p.publishedAt, { withYear: true })}`
                          : `Updated ${formatDate(p.updatedAt, { withYear: true })}`}
                      </span>
                    </div>
                    <h3 className="mt-1.5 truncate text-[14px] font-semibold text-foreground transition-colors group-hover:text-gold">
                      {p.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">{p.excerpt}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
                      <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5">{p.category}</span>
                      <span>· {p.tags.length} tags</span>
                      <span>· {readTimeFor(p.content)}</span>
                      <span>· /{p.slug}</span>
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-2 self-start">
                  <button
                    onClick={() => onEdit(p)}
                    aria-label={`Edit ${p.title}`}
                    title="Edit post"
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    <Pencil size={11} aria-hidden="true" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  {confirmDeleteId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          await onDelete(p);
                          setConfirmDeleteId(null);
                        }}
                        aria-label={`Confirm delete ${p.title}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-2.5 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/25"
                      >
                        <Trash2 size={11} aria-hidden="true" /> Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Cancel delete"
                        className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      disabled={deletingId === p.id}
                      aria-label={`Delete ${p.title}`}
                      title="Delete post"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PostsStatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  accent: string;
  bg: string;
}) {
  return (
    <div className="surface-card p-5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${bg} ${accent}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <p className="mt-3.5 font-display text-[26px] font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
