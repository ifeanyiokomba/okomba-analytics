/* ─────────────────────────────────────────────────────────────
   BATCH 13 (§64–§67) — CLIENT-SAFE learning vocabulary.

   Pure types + label maps for the Okomba Learning student portal
   (same Turbopack lesson as campaigns-shared: a client component
   importing a module that transitively pulls Prisma drags the
   engine into the browser bundle — so THIS file has ZERO server
   imports; route handlers own the server projections).
   ───────────────────────────────────────────────────────────── */

/* ── §66 vocabulary ─────────────────────────────────────────── */

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const LESSON_KINDS = ["text", "video"] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export const RESOURCE_KINDS = ["pdf", "link", "slide", "exercise"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const STUDENT_STATUSES = ["active", "suspended"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const ENROLLMENT_STATUSES = ["active", "completed"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const LESSON_PROGRESS_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type LessonProgressStatus = (typeof LESSON_PROGRESS_STATUSES)[number];

export const ANNOUNCEMENT_AUDIENCES = ["all", "course"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/* ── Label maps (chips are Tailwind class fragments, house style) ── */

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const COURSE_LEVEL_META: Record<CourseLevel, { label: string; chip: string }> = {
  beginner: { label: "Beginner", chip: "border-teal-400/35 bg-teal-400/10 text-teal-600 dark:text-teal-300" },
  intermediate: { label: "Intermediate", chip: "border-amber-400/35 bg-amber-400/10 text-amber-600 dark:text-amber-300" },
  advanced: { label: "Advanced", chip: "border-rose-400/35 bg-rose-400/10 text-rose-600 dark:text-rose-300" },
};

export const LESSON_KIND_LABELS: Record<LessonKind, string> = {
  text: "Text lesson",
  video: "Video lesson",
};

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  pdf: "PDF",
  link: "Link",
  slide: "Slides",
  exercise: "Exercise",
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: "In progress",
  completed: "Completed",
};

export const LESSON_PROGRESS_LABELS: Record<LessonProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export const LESSON_PROGRESS_META: Record<LessonProgressStatus, { label: string; chip: string; dot: string }> = {
  not_started: { label: "Not started", chip: "border-white/15 bg-white/[0.04] text-muted-foreground", dot: "bg-white/30" },
  in_progress: { label: "In progress", chip: "border-amber-400/35 bg-amber-400/10 text-amber-300", dot: "bg-amber-400" },
  completed: { label: "Completed", chip: "border-teal-400/35 bg-teal-400/10 text-teal-300", dot: "bg-teal-400" },
};

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: "All students",
  course: "Course",
};

/* ── DTOs (server routes project rows into these shapes) ─────── */

/** §65 student profile — never includes passwordHash/passwordSalt. */
export type StudentPublicDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  avatarUrl: string | null;
  status: StudentStatus;
  createdAt: string;
};

/** GET /api/learning/auth/me response body. */
export type StudentMeDto = StudentPublicDto & {
  enrolledCourseCount: number;
  completedLessonCount: number;
  overallProgressPercent: number; // across all enrolled courses
};

/** Catalogue card (public, published courses only). */
export type CourseCardDto = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: CourseLevel;
  coverEmoji: string;
  coverUrl: string | null;
  priceNgn: number;
  moduleCount: number;
  lessonCount: number;
  totalMinutes: number;
};

/** Lesson list item inside a course detail (content gated). */
export type LessonListItemDto = {
  id: string;
  title: string;
  kind: LessonKind;
  durationMinutes: number;
  isPreview: boolean;
  hasQuiz: boolean;
  quizQuestionCount: number;
  /** Present ONLY when the caller may read the body (enrolled or isPreview). */
  content?: string | null;
  videoUrl?: string | null;
  /** Present when the caller is enrolled — their own progress row. */
  progress?: { status: LessonProgressStatus; secondsSpent: number; completedAt: string | null };
};

export type ModuleDto = {
  id: string;
  title: string;
  summary: string | null;
  sortOrder: number;
  lessons: LessonListItemDto[];
};

/** GET /api/learning/courses/[slug] response body (public). */
export type CourseDetailDto = CourseCardDto & {
  description: string | null;
  published: boolean;
  enrolled: boolean; // is the CALLER enrolled (false when anonymous)
  enrollmentStatus: EnrollmentStatus | null;
  progressPercent: number | null; // for enrolled callers
  modules: ModuleDto[];
};

export type LessonResourceDto = {
  id: string;
  title: string;
  url: string;
  kind: ResourceKind;
  sortOrder: number;
};

/** Student-facing quiz question — correctOptionId NEVER included. */
export type QuizQuestionDto = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  sortOrder: number;
};

export type StudentQuizDto = {
  id: string;
  title: string;
  passScore: number;
  questionCount: number;
  questions: QuizQuestionDto[];
};

/** GET /api/learning/lessons/[id] response body (full content). */
export type LessonDetailDto = {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  kind: LessonKind;
  content: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  isPreview: boolean;
  resources: LessonResourceDto[];
  quiz: StudentQuizDto | null;
  progress: { status: LessonProgressStatus; secondsSpent: number; completedAt: string | null } | null;
};

/** POST /api/learning/quiz/[id]/attempt response — answers graded
    server-side; correctOptionId + explanation revealed AFTER grading. */
export type QuizAttemptResultDto = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  scorePercent: number;
  passScore: number;
  passed: boolean;
  correctCount: number;
  questionCount: number;
  results: {
    questionId: string;
    prompt: string;
    selectedOptionId: string | null;
    correct: boolean;
    correctOptionId: string;
    explanation: string | null;
  }[];
};

/** Dashboard "continue learning" row — one per enrolled course that
    still has a next/unfinished lesson. */
export type ContinueLearningDto = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coverEmoji: string;
  lessonId: string;
  lessonTitle: string;
  lessonKind: LessonKind;
  durationMinutes: number;
  progressPercent: number; // course-level
  courseCompleted: boolean;
};

export type EnrolledCourseCardDto = CourseCardDto & {
  enrollmentStatus: EnrollmentStatus;
  progressPercent: number;
  completedLessons: number;
};

export type LearningActivityDto = {
  type: "lesson_completed" | "lesson_progress" | "quiz_attempt";
  label: string; // e.g. "Completed “HTML document structure”"
  courseTitle: string | null;
  at: string; // ISO
};

export type QuizStatsDto = {
  attempts: number;
  passed: number;
};

export type AnnouncementDto = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  courseTitle: string | null;
  createdAt: string;
};

/** GET /api/learning/me/dashboard response body. */
export type DashboardDto = {
  student: StudentPublicDto;
  continueLearning: ContinueLearningDto[];
  enrolledCourses: EnrolledCourseCardDto[];
  overallProgressPercent: number;
  recentActivity: LearningActivityDto[];
  announcements: AnnouncementDto[];
  quizStats: QuizStatsDto;
};

/* ── Admin-side DTOs (education tools) ───────────────────────── */

export type AdminCourseDto = CourseCardDto & {
  description: string | null;
  published: boolean;
  sortOrder: number;
  enrollmentCount: number;
  createdAt: string;
};

/** Lesson inside the admin course detail (full content included). */
export type AdminLessonDto = {
  id: string;
  title: string;
  kind: LessonKind;
  content: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  isPreview: boolean;
  sortOrder: number;
  resources: LessonResourceDto[];
  quiz: { id: string; title: string; passScore: number; questionCount: number } | null;
};

export type AdminModuleDto = {
  id: string;
  title: string;
  summary: string | null;
  sortOrder: number;
  lessons: AdminLessonDto[];
};

/** GET /api/admin/learning/courses/[id] response body. */
export type AdminCourseDetailDto = AdminCourseDto & {
  modules: AdminModuleDto[];
};

export type AdminQuizQuestionDto = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string | null;
  sortOrder: number;
};

export type AdminQuizDto = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  passScore: number;
  questionCount: number;
  attemptCount: number;
  passRate: number | null; // percent of attempts passed, null when 0 attempts
  questions: AdminQuizQuestionDto[];
};

export type AdminStudentRowDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  status: StudentStatus;
  enrolledCourseCount: number;
  avgProgressPercent: number; // across enrolled courses (0 when none)
  lastActivityAt: string | null;
  createdAt: string;
};

export type AdminStudentEnrollmentDto = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  progressPercent: number;
};

export type AdminStudentAttemptDto = {
  id: string;
  quizTitle: string;
  lessonTitle: string;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
};

export type AdminStudentDetailDto = AdminStudentRowDto & {
  avatarUrl: string | null;
  linkedCustomerEmail: string | null;
  enrollments: AdminStudentEnrollmentDto[];
  attempts: AdminStudentAttemptDto[];
};

export type AdminOverviewDto = {
  studentCount: number;
  activeStudentCount: number; // session or progress within 30 days
  publishedCourseCount: number;
  draftCourseCount: number;
  enrollmentCount: number;
  completionCount: number;
  quizAttemptCount: number;
  quizPassRate: number | null; // percent, null when 0 attempts
  announcementCount: number;
  recentSignups: { id: string; name: string; email: string; createdAt: string }[];
};
