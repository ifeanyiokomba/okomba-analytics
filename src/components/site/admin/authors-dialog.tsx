"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── BATCH 5 (§43): author profile management ──────────────
   Create / edit / deactivate the authors shown on public posts.
   Avatars upload through the same optimized media pipeline
   (/api/admin/media → sharp → webp). */

export type AuthorRow = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  active: boolean;
  postCount: number;
};

export function AuthorsDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void; // refresh posts/authors in the parent
}) {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AuthorRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("Contributor");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  // Escape + scroll lock (§14)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (editing ? setEditing(null) : onClose());
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, editing]);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/posts/authors");
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Failed to load authors");
      setAuthors(j.authors as AuthorRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load authors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setName("");
    setRole("Contributor");
    setBio("");
    setAvatarUrl(null);
    setActive(true);
    setError(null);
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const startEdit = (a: AuthorRow) => {
    setEditing(a);
    setName(a.name);
    setRole(a.role);
    setBio(a.bio ?? "");
    setAvatarUrl(a.avatarUrl);
    setActive(a.active);
    setError(null);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: form });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Avatar upload failed");
      setAvatarUrl(j.asset.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editing;
      const res = await fetch("/api/admin/posts/authors", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editing!.id } : {}),
          name: name.trim(),
          role: role.trim() || "Contributor",
          bio: bio.trim() || null,
          avatarUrl,
          active,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? "Save failed");
      setEditing(null);
      setName("");
      setRole("Contributor");
      setBio("");
      setAvatarUrl(null);
      setActive(true);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: AuthorRow) => {
    await fetch("/api/admin/posts/authors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, active: !a.active }),
    });
    await load();
    onChanged();
  };

  const remove = async (a: AuthorRow) => {
    try {
      const res = await fetch(`/api/admin/posts/authors?id=${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setConfirmDeleteId(null);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const formOpen = editing !== null || name !== "" || role !== "Contributor" || bio !== "" || avatarUrl !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#03050a]/85 backdrop-blur-md sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Manage authors"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="section-dark relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.09] bg-[#0b101c] shadow-float sm:rounded-3xl [animation:slide-in-up_0.35s_cubic-bezier(0.22,1,0.36,1)]">
        <header className="relative border-b border-white/[0.06] p-6 md:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/[0.12] blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim text-gold">
                <UserRound size={16} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-[20px] font-bold text-foreground">Author profiles</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Authors appear by name, role and avatar on public posts (§43).
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close authors"
              className="shrink-0 rounded-xl border border-white/[0.09] bg-white/[0.04] p-2.5 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-6 md:px-7">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-red-300">
              {error}
            </p>
          )}

          {/* Create / edit form */}
          {formOpen ? (
            <section aria-label={editing ? `Edit ${editing.name}` : "New author"} className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.04] p-5">
            <h3 className="text-[13.5px] font-semibold text-foreground">
              {editing ? `Edit: ${editing.name}` : "New author"}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Name</span>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Ifeanyi Okomba"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Role / title</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Founder & Lead Analyst"
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                Short bio <span className="font-mono text-[10px] text-muted-foreground/60">({bio.length}/400)</span>
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={400}
                placeholder="One or two lines shown under the author name."
                className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/60"
              />
            </label>

            {/* Avatar (§21 optimized upload) */}
            <div className="mt-4">
              <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Avatar</span>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <>
                    { }
                    <img src={avatarUrl} alt="Author avatar" className="h-14 w-14 rounded-full border border-gold/25 object-cover" />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      aria-label="Remove avatar"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.015] px-4 py-3 text-[12px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold">
                    {uploading ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                    {uploading ? "Uploading…" : "Upload avatar (square photo works best)"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadAvatar(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Active (selectable in editor)
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setRole("Contributor");
                  setBio("");
                  setAvatarUrl(null);
                  setActive(true);
                  setError(null);
                }}
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={13} aria-hidden="true" />}
                {editing ? "Save author" : "Create author"}
              </button>
            </div>
          </section>
          ) : (
            <button
              type="button"
              onClick={startCreate}
              className="btn-shine mb-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-light to-gold px-5 py-2.5 text-[13px] font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
            >
              <Plus size={13} aria-hidden="true" /> New author
            </button>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gold" aria-label="Loading authors" />
            </div>
          ) : authors.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <UserRound size={28} className="text-muted-foreground/40" aria-hidden="true" />
              <p className="text-[13px] text-muted-foreground">
                No authors yet — create one above and select them in the post editor.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.07]">
              {authors.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-4">
                  {a.avatarUrl ? (
                     
                    <img src={a.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white/[0.1] object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] font-display text-[13px] font-bold text-muted-foreground">
                      {initials(a.name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-foreground">{a.name}</p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                          a.active ? "border-teal/30 bg-teal-dim text-teal" : "border-white/15 bg-white/5 text-muted-foreground"
                        )}
                      >
                        {a.active ? "active" : "inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {a.role} · {a.postCount} post{a.postCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      aria-label={`Edit ${a.name}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gold/25 bg-gold-dim px-3 text-[11.5px] font-semibold text-gold transition-colors hover:border-gold/50 hover:bg-gold/20"
                    >
                      <Pencil size={11} aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(a)}
                      className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {a.active ? "Deactivate" : "Activate"}
                    </button>
                    {confirmDeleteId === a.id ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void remove(a)}
                          aria-label={`Confirm delete ${a.name}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-3 text-[11.5px] font-semibold text-red-300 transition-colors hover:bg-red-500/25"
                        >
                          <Trash2 size={11} aria-hidden="true" /> Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(a.id)}
                        disabled={a.postCount > 0}
                        title={a.postCount > 0 ? "Authors with posts can be deactivated instead" : "Delete author"}
                        aria-label={`Delete ${a.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-40"
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
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
