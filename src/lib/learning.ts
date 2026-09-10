/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) — OKOMBA LEARNING server helpers.

   Server-only projections + zod payload schemas shared by the
   /api/learning/* (student) and /api/admin/learning/* (education
   tools) routes. DTO shapes live in the client-safe
   learning-shared.ts (no Prisma import here reaches a browser).
   ───────────────────────────────────────────────────────────── */

import { z } from "zod";
import { db } from "@/lib/db";
import { jsonLoose } from "@/lib/db";
import {
  ANNOUNCEMENT_AUDIENCES,
  COURSE_LEVELS,
  LESSON_KINDS,
  RESOURCE_KINDS,
  type AnnouncementAudience,
  type AnnouncementDto,
  type CourseCardDto,
  type CourseDetailDto,
  type CourseLevel,
  type LessonKind,
  type LessonListItemDto,
  type LessonProgressStatus,
  type ModuleDto,
  type ResourceKind,
  type StudentPublicDto,
} from "@/lib/learning-shared";

/* ── slug helper (admin course create) ───────────────────────── */

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug.length >= 2 ? slug : "course";
}

/* ── zod payload schemas (house style: first issue → 422) ────── */

export const COURSE_CREATE_SCHEMA = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (letters, digits, dashes)")
    .optional(),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(8000).optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  coverEmoji: z.string().trim().min(1).max(8).optional(),
  coverUrl: z.string().trim().max(500).optional(),
  priceNgn: z.number().int("priceNgn must be an integer").min(0).max(100_000_000).optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const COURSE_UPDATE_SCHEMA = COURSE_CREATE_SCHEMA.partial();

export const MODULE_CREATE_SCHEMA = z.object({
  title: z.string().trim().min(2, "Module title must be at least 2 characters").max(120),
  summary: z.string().trim().max(300).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const MODULE_UPDATE_SCHEMA = MODULE_CREATE_SCHEMA.partial();

export const LESSON_CREATE_SCHEMA = z.object({
  title: z.string().trim().min(2, "Lesson title must be at least 2 characters").max(160),
  kind: z.enum(LESSON_KINDS).optional(),
  content: z.string().max(20000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  isPreview: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const LESSON_UPDATE_SCHEMA = LESSON_CREATE_SCHEMA.partial();

export const RESOURCE_CREATE_SCHEMA = z.object({
  title: z.string().trim().min(1, "Resource title is required").max(160),
  url: z.string().trim().min(1, "Resource URL is required").max(1000),
  kind: z.enum(RESOURCE_KINDS).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const QUIZ_QUESTION_SCHEMA = z
  .object({
    prompt: z.string().trim().min(4, "Question prompt must be at least 4 characters").max(600),
    options: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(40),
          text: z.string().trim().min(1).max(200),
        })
      )
      .min(2, "Each question needs at least 2 options")
      .max(6),
    correctOptionId: z.string().trim().min(1).max(40),
    explanation: z.string().trim().max(600).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((q) => new Set(q.options.map((o) => o.id)).size === q.options.length, {
    message: "Option ids must be unique within a question",
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), {
    message: "correctOptionId must match one of the option ids",
  });

export const QUIZ_UPSERT_SCHEMA = z.object({
  title: z.string().trim().min(2, "Quiz title must be at least 2 characters").max(160),
  passScore: z.number().int().min(1).max(100).optional(),
  questions: z.array(QUIZ_QUESTION_SCHEMA).min(1, "A quiz needs at least one question").max(50),
});

export const ANNOUNCEMENT_CREATE_SCHEMA = z
  .object({
    title: z.string().trim().min(2, "Announcement title must be at least 2 characters").max(160),
    body: z.string().trim().min(2, "Announcement body must be at least 2 characters").max(4000),
    audience: z.enum(ANNOUNCEMENT_AUDIENCES).optional(),
    courseId: z.string().trim().min(1).optional(),
  })
  .refine((a) => a.audience !== "course" || (a.courseId ?? "").length > 0, {
    message: 'courseId is required when audience is "course"',
  });

/* ── student DTO (never passwordHash/passwordSalt) ───────────── */

export type StudentFullRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  avatarUrl: string | null;
  status: string;
  linkedCustomerEmail: string | null;
  createdAt: Date;
};

export function toStudentPublicDto(student: StudentFullRow): StudentPublicDto {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    country: student.country,
    avatarUrl: student.avatarUrl,
    status: student.status === "suspended" ? "suspended" : "active",
    createdAt: student.createdAt.toISOString(),
  };
}

/* ── course card projection (public + admin + dashboard) ─────── */

export type CourseCardRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description?: string | null;
  level: string;
  coverEmoji: string;
  coverUrl: string | null;
  priceNgn: number;
  published?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  modules: { lessons: { durationMinutes: number }[] }[];
};

export function toCourseCardDto(course: CourseCardRow): CourseCardDto {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const totalMinutes = lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    level: (COURSE_LEVELS as readonly string[]).includes(course.level)
      ? (course.level as CourseLevel)
      : "beginner",
    coverEmoji: course.coverEmoji,
    coverUrl: course.coverUrl,
    priceNgn: course.priceNgn,
    moduleCount: course.modules.length,
    lessonCount: lessons.length,
    totalMinutes,
  };
}

/* ── course detail projection with §66 content gating ────────── */

export type LessonRowForDetail = {
  id: string;
  title: string;
  kind: string;
  content: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  isPreview: boolean;
  sortOrder: number;
  quiz: { id: string; questions: { id: string }[] } | null;
};

/* Omit "modules" before re-declaring it — intersecting two array types
   (card's shallow modules × detail's deep modules) breaks .map()
   inference in TS and cascades "property does not exist" errors. */
export type CourseDetailRow = Omit<CourseCardRow, "modules"> & {
  description: string | null;
  published: boolean;
  modules: {
    id: string;
    title: string;
    summary: string | null;
    sortOrder: number;
    lessons: LessonRowForDetail[];
  }[];
};

export type LessonProgressLite = {
  status: string;
  secondsSpent: number;
  completedAt: Date | null;
};

/** content is revealed ONLY to enrolled students or preview lessons. */
export function toCourseDetailDto(
  course: CourseDetailRow,
  opts: {
    enrolled: boolean;
    enrollmentStatus: string | null;
    progressPercent: number | null;
    progressByLessonId: Map<string, LessonProgressLite>;
  }
): CourseDetailDto {
  const card = toCourseCardDto(course);
  const modules: ModuleDto[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    summary: m.summary,
    sortOrder: m.sortOrder,
    lessons: m.lessons.map((lesson): LessonListItemDto => {
      const item: LessonListItemDto = {
        id: lesson.id,
        title: lesson.title,
        kind: normalizeLessonKind(lesson.kind),
        durationMinutes: lesson.durationMinutes,
        isPreview: lesson.isPreview,
        hasQuiz: !!lesson.quiz,
        quizQuestionCount: lesson.quiz?.questions.length ?? 0,
      };
      const mayRead = opts.enrolled || lesson.isPreview;
      if (mayRead) {
        item.content = lesson.content;
        item.videoUrl = lesson.videoUrl;
      }
      if (opts.enrolled) {
        const p = opts.progressByLessonId.get(lesson.id);
        item.progress = p
          ? {
              status: normalizeProgressStatus(p.status),
              secondsSpent: p.secondsSpent,
              completedAt: p.completedAt ? p.completedAt.toISOString() : null,
            }
          : { status: "not_started", secondsSpent: 0, completedAt: null };
      }
      return item;
    }),
  }));
  return {
    ...card,
    description: course.description,
    published: course.published,
    enrolled: opts.enrolled,
    enrollmentStatus:
      opts.enrollmentStatus === "completed" ? "completed" : opts.enrollmentStatus === "active" ? "active" : null,
    progressPercent: opts.progressPercent,
    modules,
  };
}

export function normalizeProgressStatus(status: string): LessonProgressStatus {
  return status === "completed" ? "completed" : status === "in_progress" ? "in_progress" : "not_started";
}

export function normalizeLessonKind(kind: string): LessonKind {
  return kind === "video" ? "video" : "text";
}

export function normalizeResourceKind(kind: string): ResourceKind {
  return (RESOURCE_KINDS as readonly string[]).includes(kind) ? (kind as ResourceKind) : "link";
}

/* ── enrollment + progress helpers ───────────────────────────── */

export async function getEnrollment(studentId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
}

/** Course-level progress percent for a student (0 for empty courses). */
export async function courseProgressPercent(studentId: string, courseId: string): Promise<{
  percent: number;
  completedLessons: number;
  totalLessons: number;
}> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { modules: { select: { lessons: { select: { id: true } } } } },
  });
  const lessonIds = course?.modules.flatMap((m) => m.lessons.map((l) => l.id)) ?? [];
  if (lessonIds.length === 0) return { percent: 0, completedLessons: 0, totalLessons: 0 };
  const completed = await db.lessonProgress.count({
    where: { studentId, lessonId: { in: lessonIds }, status: "completed" },
  });
  return {
    percent: Math.round((completed / lessonIds.length) * 100),
    completedLessons: completed,
    totalLessons: lessonIds.length,
  };
}

/** §64 auto-completion: when EVERY lesson is completed, flip the
 *  enrollment to completed (idempotent — only active enrollments). */
export async function maybeAutoCompleteEnrollment(studentId: string, courseId: string): Promise<boolean> {
  const { totalLessons, completedLessons } = await courseProgressPercent(studentId, courseId);
  if (totalLessons > 0 && completedLessons === totalLessons) {
    await db.enrollment.updateMany({
      where: { studentId, courseId, status: "active" },
      data: { status: "completed", completedAt: new Date() },
    });
    return true;
  }
  return false;
}

/* ── quiz projection (student view: no correctOptionId) ──────── */

export type QuizQuestionRow = {
  id: string;
  prompt: string;
  options: unknown;
  correctOptionId: string;
  explanation: string | null;
  sortOrder: number;
};

export function parseQuizOptions(raw: unknown): { id: string; text: string }[] {
  const value = jsonLoose<{ id?: unknown; text?: unknown }[]>(raw);
  if (!Array.isArray(value)) return [];
  return value
    .filter((o) => o && typeof o === "object" && typeof o.id === "string" && typeof o.text === "string")
    .map((o) => ({ id: o.id as string, text: o.text as string }));
}

export function parseAttemptAnswers(raw: unknown): { questionId: string; optionId: string }[] {
  const value = jsonLoose<{ questionId?: unknown; optionId?: unknown }[]>(raw);
  if (!Array.isArray(value)) return [];
  return value
    .filter((a) => a && typeof a === "object" && typeof a.questionId === "string" && typeof a.optionId === "string")
    .map((a) => ({ questionId: a.questionId as string, optionId: a.optionId as string }));
}

/* ── announcements (§64 admin-posted) ────────────────────────── */

export function toAnnouncementDto(
  row: { id: string; title: string; body: string; audience: string; createdAt: Date },
  courseTitle: string | null
): AnnouncementDto {
  const audience: AnnouncementAudience = row.audience === "course" ? "course" : "all";
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience,
    courseTitle,
    createdAt: row.createdAt.toISOString(),
  };
}

/* ── misc vocabulary re-exports for route convenience ────────── */

export type { CourseLevel, LessonKind, ResourceKind, AnnouncementAudience };
