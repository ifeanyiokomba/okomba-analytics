"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COURSE_LEVEL_LABELS,
  STUDENT_STATUS_LABELS,
  type AdminCourseDto,
  type AdminOverviewDto,
  type AdminStudentRowDto,
  type CourseLevel,
} from "@/lib/learning-shared";
import { formatTimestamp, timeAgo } from "./types";
import {
  AnnouncementDialog,
  ConfirmDialog,
  CourseDetailDialog,
  CourseSaveDialog,
  StudentDetailDialog,
  type AdminAnnouncementRow,
  type CourseSavePayload,
  type Notify,
} from "./learning-admin-dialogs";

/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) part 3 — admin "Learning" tab.

   Self-fetching (whatsapp-tab / ai-campaigns-tab pattern — the
   dashboard load() is untouched). Four sub-views via Tabs:
   Overview · Courses · Students · Announcements. All mutations
   go through the /api/admin/learning/* routes (manage_students
   RBAC — the tab itself is already gated in dashboard.tsx).
   ───────────────────────────────────────────────────────────── */

const LEVEL_CHIP: Record<CourseLevel, string> = {
  beginner: "border-teal/35 bg-teal-dim text-teal",
  intermediate: "border-gold/35 bg-gold-dim text-gold",
  advanced: "border-rose-400/35 bg-rose-400/10 text-rose-300",
};

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold",
        className ?? "border-white/15 bg-white/[0.04] text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function MiniBar({ percent, className }: { percent: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% average progress`}
      className={cn("h-1.5 w-20 overflow-hidden rounded-full bg-white/10", className)}
    >
      <div className="h-full rounded-full bg-teal/80" style={{ width: `${pct}%` }} />
    </div>
  );
}

async function jsonFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    return { res, j } as const;
  } catch {
    return { res: null, j: null } as const;
  }
}

/* ── Overview stat card (module scope: stable identity) ── */
function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <span className={cn("shrink-0", tone ?? "text-teal")}>{icon}</span>
      </div>
      <p className="mt-1.5 text-[22px] font-bold leading-tight text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */

export function LearningAdminTab({ notify }: { notify: Notify }) {
  /* data */
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [courses, setCourses] = useState<AdminCourseDto[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [students, setStudents] = useState<AdminStudentRowDto[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AdminAnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  /* students search (debounced) */
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* dialogs (conditional mount = fresh state) */
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<AdminCourseDto | null>(null);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<AdminCourseDto | null>(null);
  const [deleteCourseBusy, setDeleteCourseBusy] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [annOpen, setAnnOpen] = useState(false);
  const [deleteAnn, setDeleteAnn] = useState<AdminAnnouncementRow | null>(null);
  const [deleteAnnBusy, setDeleteAnnBusy] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

  /* ── loaders (try/catch/finally — the shape the set-state-in-effect
     lint rule accepts for effect-invoked async loaders) ── */
  const loadOverview = useCallback(async () => {
    try {
      const { res, j } = await jsonFetch("/api/admin/learning/overview");
      if (res?.ok && j?.ok) setOverview((j as { overview: AdminOverviewDto }).overview);
    } catch {
      /* transient */
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const { res, j } = await jsonFetch("/api/admin/learning/courses");
      if (res?.ok && j?.ok) setCourses((j as { courses: AdminCourseDto[] }).courses ?? []);
    } catch {
      /* transient */
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async (query: string) => {
    try {
      const { res, j } = await jsonFetch(`/api/admin/learning/students?q=${encodeURIComponent(query)}`);
      if (res?.ok && j?.ok) setStudents((j as { students: AdminStudentRowDto[] }).students ?? []);
    } catch {
      /* transient */
    } finally {
      setStudentsLoading(false);
      setSearching(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const { res, j } = await jsonFetch("/api/admin/learning/announcements");
      if (res?.ok && j?.ok) setAnnouncements((j as { announcements: AdminAnnouncementRow[] }).announcements ?? []);
    } catch {
      /* transient */
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadCourses();
    void loadStudents("");
    void loadAnnouncements();
  }, [loadOverview, loadCourses, loadStudents, loadAnnouncements]);

  const refreshAll = useCallback(() => {
    void loadOverview();
    void loadCourses();
    void loadAnnouncements();
  }, [loadOverview, loadCourses, loadAnnouncements]);

  /* debounced students search */
  const onSearch = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      void loadStudents(value.trim());
    }, 350);
  };

  /* ── course mutations ── */
  const saveCourse = async (payload: CourseSavePayload, id?: string) => {
    const { res, j } = await jsonFetch(id ? `/api/admin/learning/courses/${id}` : "/api/admin/learning/courses", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res?.ok || !j?.ok) {
      notify(j?.error ?? "Course save failed", "err");
      return false;
    }
    notify(id ? "Course updated" : "Course created", "ok");
    refreshAll();
    return true;
  };

  const togglePublish = async (course: AdminCourseDto) => {
    setToggleBusyId(course.id);
    const { res, j } = await jsonFetch(`/api/admin/learning/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !course.published }),
    });
    setToggleBusyId(null);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Publish toggle failed", "err");
    notify(course.published ? `“${course.title}” unpublished` : `“${course.title}” published`, "ok");
    void loadCourses();
    void loadOverview();
  };

  const runDeleteCourse = async () => {
    if (!deleteCourse) return;
    setDeleteCourseBusy(true);
    const { res, j } = await jsonFetch(`/api/admin/learning/courses/${deleteCourse.id}`, { method: "DELETE" });
    setDeleteCourseBusy(false);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Course delete failed", "err");
    notify(`“${deleteCourse.title}” deleted`, "ok");
    setDeleteCourse(null);
    refreshAll();
  };

  /* ── announcements mutations ── */
  const saveAnnouncement = async (payload: { title: string; body: string; audience: "all" | "course"; courseId?: string }) => {
    const { res, j } = await jsonFetch("/api/admin/learning/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res?.ok || !j?.ok) {
      notify(j?.error ?? "Announcement failed", "err");
      return false;
    }
    notify("Announcement published", "ok");
    void loadAnnouncements();
    void loadOverview();
    return true;
  };

  const runDeleteAnn = async () => {
    if (!deleteAnn) return;
    setDeleteAnnBusy(true);
    const { res, j } = await jsonFetch(`/api/admin/learning/announcements/${deleteAnn.id}`, { method: "DELETE" });
    setDeleteAnnBusy(false);
    if (!res?.ok || !j?.ok) return notify(j?.error ?? "Announcement delete failed", "err");
    notify("Announcement deleted", "ok");
    setDeleteAnn(null);
    void loadAnnouncements();
    void loadOverview();
  };

  /* ── header ── */
  const header = (
    <div className="surface-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim">
          <GraduationCap size={16} className="text-gold" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-foreground">Learning</h2>
          <p className="text-[11.5px] text-muted-foreground">
            §64–§67 — courses, students, quizzes &amp; announcements for the Okomba Learning portal.
          </p>
        </div>
      </div>
      <Button
        onClick={() => {
          void loadOverview();
          void loadCourses();
          void loadStudents(q.trim());
          void loadAnnouncements();
        }}
        variant="outline"
        className="min-h-[44px] border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:border-gold/40 hover:text-gold"
      >
        <RefreshCw size={14} aria-hidden="true" /> Refresh
      </Button>
    </div>
  );

  /* ── overview stat card (module-level component below) ── */

  return (
    <div className="flex flex-col gap-5">
      {header}

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="h-auto flex-wrap bg-white/[0.03] p-1">
          <TabsTrigger value="overview" className="min-h-[38px] px-3 text-[12px] font-medium data-[state=active]:bg-gold-dim data-[state=active]:text-gold">
            Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="min-h-[38px] px-3 text-[12px] font-medium data-[state=active]:bg-gold-dim data-[state=active]:text-gold">
            Courses {courses.length > 0 && <span className="ml-1 font-mono text-[10px] text-muted-foreground">{courses.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="students" className="min-h-[38px] px-3 text-[12px] font-medium data-[state=active]:bg-gold-dim data-[state=active]:text-gold">
            Students {overview && overview.studentCount > 0 && <span className="ml-1 font-mono text-[10px] text-muted-foreground">{overview.studentCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="min-h-[38px] px-3 text-[12px] font-medium data-[state=active]:bg-gold-dim data-[state=active]:text-gold">
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-0">
          {overviewLoading || !overview ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <Stat label="Students" value={overview.studentCount} sub={`${overview.activeStudentCount} active (30d)`} icon={<Users size={14} aria-hidden="true" />} />
                <Stat label="Courses" value={overview.publishedCourseCount} sub={`${overview.draftCourseCount} draft${overview.draftCourseCount === 1 ? "" : "s"}`} icon={<BookOpen size={14} aria-hidden="true" />} tone="text-gold" />
                <Stat label="Enrollments" value={overview.enrollmentCount} icon={<CheckCircle2 size={14} aria-hidden="true" />} />
                <Stat label="Completions" value={overview.completionCount} icon={<GraduationCap size={14} aria-hidden="true" />} tone="text-gold" />
                <Stat label="Quiz attempts" value={overview.quizAttemptCount} sub={overview.quizPassRate !== null ? `${overview.quizPassRate}% pass rate` : "no attempts yet"} icon={<ClipboardCheck size={14} aria-hidden="true" />} />
                <Stat label="Announcements" value={overview.announcementCount} icon={<Megaphone size={14} aria-hidden="true" />} tone="text-gold" />
              </div>

              <div className="surface-card p-4">
                <p className="mb-3 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70">Recent signups</p>
                {overview.recentSignups.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">No students have signed up yet.</p>
                ) : (
                  <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto [scrollbar-width:thin]">
                    {overview.recentSignups.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                        <span className="text-[12.5px] font-medium text-foreground">{s.name}</span>
                        <span className="font-mono text-[10.5px] text-muted-foreground">{s.email}</span>
                        <span className="ml-auto text-[10.5px] text-muted-foreground/70">{timeAgo(s.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Courses ── */}
        <TabsContent value="courses" className="mt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-muted-foreground">
              {coursesLoading ? "Loading courses…" : `${courses.length} course${courses.length === 1 ? "" : "s"} · open a row to author modules, lessons, quizzes & resources`}
            </p>
            <Button onClick={() => setCreateCourseOpen(true)} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
              <Plus size={14} aria-hidden="true" /> New course
            </Button>
          </div>

          {coursesLoading ? (
            <div className="mt-3 grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="surface-card mt-3 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              No courses yet — create the first one.
            </p>
          ) : (
            <div className="surface-card mt-3 overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Course", "Level", "Status", "Structure", "Enrolled", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className="text-lg" aria-hidden="true">{c.coverEmoji}</span>
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate text-[13px] font-semibold text-foreground">{c.title}</span>
                            <span className="block max-w-[260px] truncate font-mono text-[10px] text-muted-foreground">/{c.slug}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Chip className={LEVEL_CHIP[c.level]}>{COURSE_LEVEL_LABELS[c.level]}</Chip>
                      </td>
                      <td className="px-4 py-2.5">
                        <Chip className={c.published ? "border-teal/35 bg-teal-dim text-teal" : "border-amber-400/35 bg-amber-400/10 text-amber-300"}>
                          {c.published ? "Published" : "Draft"}
                        </Chip>
                      </td>
                      <td className="px-4 py-2.5 text-[11.5px] text-muted-foreground">
                        {c.moduleCount} modules · {c.lessonCount} lessons
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-foreground">{c.enrollmentCount}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOpenCourseId(c.id)}
                            title="Open authoring view"
                            aria-label={`Open ${c.title}`}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gold/40 bg-gold-dim px-2.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
                          >
                            <Pencil size={12} aria-hidden="true" /> Open
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditCourse(c)}
                            title="Edit course details"
                            aria-label={`Edit ${c.title}`}
                            className="inline-flex h-9 items-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void togglePublish(c)}
                            disabled={toggleBusyId === c.id}
                            title={c.published ? "Unpublish (hide from catalogue)" : "Publish to catalogue"}
                            aria-label={c.published ? `Unpublish ${c.title}` : `Publish ${c.title}`}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-teal/40 bg-teal-dim px-2.5 text-[11px] text-teal transition-colors hover:bg-teal/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {toggleBusyId === c.id ? (
                              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                            ) : c.published ? (
                              <EyeOff size={12} aria-hidden="true" />
                            ) : (
                              <Eye size={12} aria-hidden="true" />
                            )}
                            <span className="hidden sm:inline">{c.published ? "Unpublish" : "Publish"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCourse(c)}
                            title="Delete course (cascades)"
                            aria-label={`Delete ${c.title}`}
                            className="inline-flex h-9 items-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Students ── */}
        <TabsContent value="students" className="mt-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
              <Input
                value={q}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search name or email…"
                aria-label="Search students"
                className="min-h-[44px] pl-9"
              />
              {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground/60" aria-hidden="true" />}
            </div>
            <p className="text-[12px] text-muted-foreground">
              {studentsLoading ? "Loading students…" : `${students.length} result${students.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {studentsLoading ? (
            <div className="mt-3 grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="surface-card mt-3 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              {q.trim() ? `No students match “${q.trim()}”.` : "No students have signed up yet."}
            </p>
          ) : (
            <div className="surface-card mt-3 overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Student", "Country", "Status", "Courses", "Avg progress", "Last activity", "Joined", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <span className="block max-w-[220px] truncate text-[13px] font-semibold text-foreground">{s.name}</span>
                        <span className="block max-w-[220px] truncate font-mono text-[10px] text-muted-foreground">{s.email}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[11.5px] text-muted-foreground">{s.country || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Chip className={s.status === "active" ? "border-teal/35 bg-teal-dim text-teal" : "border-rose-400/35 bg-rose-400/10 text-rose-300"}>
                          {STUDENT_STATUS_LABELS[s.status]}
                        </Chip>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-foreground">{s.enrolledCourseCount}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <MiniBar percent={s.avgProgressPercent} />
                          <span className="font-mono text-[10.5px] text-muted-foreground">{s.avgProgressPercent}%</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{s.lastActivityAt ? timeAgo(s.lastActivityAt) : "—"}</td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground">{formatTimestamp(s.createdAt).split(",")[0]}</td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => setStudentId(s.id)}
                          title="Open student detail"
                          aria-label={`Open ${s.name}`}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gold/40 bg-gold-dim px-2.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
                        >
                          <Pencil size={12} aria-hidden="true" /> Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Announcements ── */}
        <TabsContent value="announcements" className="mt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-muted-foreground">
              {announcementsLoading ? "Loading announcements…" : `${announcements.length} announcement${announcements.length === 1 ? "" : "s"} · shown on student dashboards (§67)`}
            </p>
            <Button onClick={() => setAnnOpen(true)} className="min-h-[44px] border border-gold/60 bg-gold text-ink hover:bg-gold-light">
              <Plus size={14} aria-hidden="true" /> New announcement
            </Button>
          </div>

          {announcementsLoading ? (
            <div className="mt-3 grid gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <p className="surface-card mt-3 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              No announcements yet — publish the first one.
            </p>
          ) : (
            <div className="mt-3 grid gap-2.5">
              {announcements.map((a) => (
                <div key={a.id} className="surface-card flex items-start justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                      <Chip className={a.audience === "all" ? "border-teal/35 bg-teal-dim text-teal" : "border-gold/35 bg-gold-dim text-gold"}>
                        {a.audience === "all" ? "Everyone" : a.courseTitle ?? "Course"}
                      </Chip>
                    </div>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">{a.body}</p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground/70">{formatTimestamp(a.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteAnn(a)}
                    title="Delete announcement"
                    aria-label={`Delete announcement “${a.title}”`}
                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-rose-400/40 hover:text-rose-300"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── dialogs (conditional mount) ── */}
      {createCourseOpen && (
        <CourseSaveDialog course={null} onClose={() => setCreateCourseOpen(false)} onSave={saveCourse} />
      )}
      {editCourse && <CourseSaveDialog course={editCourse} onClose={() => setEditCourse(null)} onSave={saveCourse} />}
      {openCourseId && (
        <CourseDetailDialog
          courseId={openCourseId}
          notify={notify}
          onClose={() => setOpenCourseId(null)}
          onChanged={() => {
            void loadCourses();
            void loadOverview();
          }}
        />
      )}
      {studentId && (
        <StudentDetailDialog
          studentId={studentId}
          notify={notify}
          onClose={() => setStudentId(null)}
          onChanged={() => {
            void loadStudents(q.trim());
            void loadOverview();
          }}
        />
      )}
      {annOpen && (
        <AnnouncementDialog courses={courses} onClose={() => setAnnOpen(false)} onSaved={saveAnnouncement} />
      )}
      {deleteCourse && (
        <ConfirmDialog
          title="Delete course?"
          message={
            <>
              <span className="font-semibold text-foreground">“{deleteCourse.title}”</span> and its modules, lessons,
              quizzes, attempts, resources, enrollments, progress rows and course announcements will all be removed
              (cascade delete). This cannot be undone.
            </>
          }
          confirmLabel="Delete course"
          busy={deleteCourseBusy}
          onConfirm={() => void runDeleteCourse()}
          onClose={() => setDeleteCourse(null)}
        />
      )}
      {deleteAnn && (
        <ConfirmDialog
          title="Delete announcement?"
          message={
            <>
              <span className="font-semibold text-foreground">“{deleteAnn.title}”</span> will disappear from student
              dashboards immediately.
            </>
          }
          confirmLabel="Delete announcement"
          busy={deleteAnnBusy}
          onConfirm={() => void runDeleteAnn()}
          onClose={() => setDeleteAnn(null)}
        />
      )}
    </div>
  );
}
