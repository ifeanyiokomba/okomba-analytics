import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/student-auth";
import { toStudentPublicDto, toCourseCardDto, toAnnouncementDto, normalizeLessonKind } from "@/lib/learning";
import type {
  ContinueLearningDto,
  DashboardDto,
  EnrolledCourseCardDto,
  LearningActivityDto,
} from "@/lib/learning-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET /api/learning/me/dashboard — §67 student dashboard.             */
/*                                                                     */
/* • continue learning: per enrolled course, the first in-progress    */
/*   lesson, else the next not-started lesson (course order).         */
/* • enrolled courses with progressPercent + completed lesson counts */
/* • recent activity: last 10 LessonProgress/QuizAttempt events       */
/* • announcements: audience=all + enrolled courses (newest 5)        */
/* • quiz stats: attempts + passed                                     */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  const guard = await requireStudent(req);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const student = guard.student;

  try {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id },
      orderBy: { enrolledAt: "asc" },
      include: {
        course: {
          include: {
            modules: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              include: {
                lessons: {
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  select: { id: true, durationMinutes: true },
                },
              },
            },
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.course.id);
    const allLessonIds = enrollments.flatMap((e) => e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)));

    const progressRows = allLessonIds.length
      ? await db.lessonProgress.findMany({
          where: { studentId: student.id, lessonId: { in: allLessonIds } },
          select: { lessonId: true, status: true },
        })
      : [];
    const progressStatusByLessonId = new Map(progressRows.map((p) => [p.lessonId, p.status]));

    const totalLessons = allLessonIds.length;
    const completedCount = progressRows.filter((p) => p.status === "completed").length;
    const overallProgressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

    /* ── enrolled course cards + continue-learning targets ── */
    const enrolledCourses: EnrolledCourseCardDto[] = [];
    const continueLearning: ContinueLearningDto[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.course;
      const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const completed = lessonIds.filter((id) => progressStatusByLessonId.get(id) === "completed").length;
      const percent = lessonIds.length === 0 ? 0 : Math.round((completed / lessonIds.length) * 100);

      enrolledCourses.push({
        ...toCourseCardDto(course),
        enrollmentStatus: enrollment.status === "completed" ? "completed" : "active",
        progressPercent: percent,
        completedLessons: completed,
      });

      // Continue-learning: first in-progress lesson, else the next
      // un-started one. A fully completed course contributes nothing.
      const nextLessonId = lessonIds.find((id) => {
        const status = progressStatusByLessonId.get(id) ?? "not_started";
        return status !== "completed";
      });
      if (nextLessonId) {
        const lesson = await db.lesson.findUnique({
          where: { id: nextLessonId },
          select: { id: true, title: true, kind: true, durationMinutes: true },
        });
        if (lesson) {
          continueLearning.push({
            courseId: course.id,
            courseSlug: course.slug,
            courseTitle: course.title,
            coverEmoji: course.coverEmoji,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonKind: normalizeLessonKind(lesson.kind),
            durationMinutes: lesson.durationMinutes,
            progressPercent: percent,
            courseCompleted: false,
          });
        }
      }
    }

    /* ── recent activity (last 10, newest first) ── */
    const [progressEvents, quizEvents] = await Promise.all([
      db.lessonProgress.findMany({
        where: { studentId: student.id },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          status: true,
          updatedAt: true,
          lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } },
        },
      }),
      db.quizAttempt.findMany({
        where: { studentId: student.id },
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          scorePercent: true,
          passed: true,
          submittedAt: true,
          quiz: { select: { title: true, lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } } } },
        },
      }),
    ]);

    const activity: LearningActivityDto[] = [
      ...progressEvents.map((e) => ({
        type: (e.status === "completed" ? "lesson_completed" : "lesson_progress") as LearningActivityDto["type"],
        label:
          e.status === "completed"
            ? `Completed “${e.lesson.title}”`
            : `Started “${e.lesson.title}”`,
        courseTitle: e.lesson.module.course.title,
        at: e.updatedAt.toISOString(),
      })),
      ...quizEvents.map((e) => ({
        type: "quiz_attempt" as const,
        label: `Quiz “${e.quiz.title}” — ${e.scorePercent}% (${e.passed ? "passed" : "failed"})`,
        courseTitle: e.quiz.lesson.module.course.title,
        at: e.submittedAt.toISOString(),
      })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
      .slice(0, 10);

    /* ── announcements: all + enrolled courses, newest 5 ── */
    const announcements = await db.announcement.findMany({
      where: {
        OR: [{ audience: "all" }, { courseId: { in: enrolledCourseIds.length ? enrolledCourseIds : ["__none__"] } }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { course: { select: { title: true } } },
    });

    /* ── quiz stats ── */
    const [attempts, passed] = await Promise.all([
      db.quizAttempt.count({ where: { studentId: student.id } }),
      db.quizAttempt.count({ where: { studentId: student.id, passed: true } }),
    ]);

    const dto: DashboardDto = {
      student: toStudentPublicDto(student),
      continueLearning,
      enrolledCourses,
      overallProgressPercent,
      recentActivity: activity,
      announcements: announcements.map((a) => toAnnouncementDto(a, a.course?.title ?? null)),
      quizStats: { attempts, passed },
    };

    return NextResponse.json({ ok: true, dashboard: dto });
  } catch (err) {
    console.error("[GET /api/learning/me/dashboard]", err);
    return NextResponse.json({ ok: false, error: "Could not load your dashboard" }, { status: 500 });
  }
}
