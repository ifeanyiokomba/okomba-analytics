/**
 * Batch 13 (§64–§67) seed — "Okomba Learning" demo catalogue.
 *
 *   bun run scripts/seed-learning.ts
 *
 * Idempotent (checked by slug/title): two published courses with the
 * §66 Course → Module → Lesson structure, one preview lesson, a
 * 3-question quiz, a downloadable resource, and two announcements.
 * Seeds NO students (accounts are created through the public signup).
 */
import { db } from "../src/lib/db";

/* ── Course 1: Web Development Foundations (§66 example structure) ── */

const WEB_DEV = {
  title: "Web Development Foundations",
  slug: "web-development-foundations",
  summary: "From your first HTML tag to a deployed React page — the hands-on foundations of modern web development.",
  description:
    "A structured, practical introduction to building for the web. You will write real HTML, style it with modern CSS, think in JavaScript, compose components in React, and understand how the backend fits in. Every lesson is hands-on: you build, break, and fix.",
  level: "beginner" as const,
  coverEmoji: "🌐",
  published: true,
  sortOrder: 1,
  modules: [
    {
      title: "HTML — Structure",
      summary: "The skeleton of every page: semantic elements, forms and accessibility.",
      lessons: [
        {
          title: "Your First Semantic Page",
          kind: "text" as const,
          durationMinutes: 15,
          isPreview: true,
          content:
            "HTML is the skeleton of every website. In this lesson you will build your first semantic page: a header, a navigation, a main content area and a footer. Semantic tags (`header`, `nav`, `main`, `footer`) tell browsers and screen readers what each region means — unlike a wall of `div`s, they make your page accessible and searchable by default.",
        },
        {
          title: "Forms That Collect Data Properly",
          kind: "text" as const,
          durationMinutes: 20,
          isPreview: false,
          content:
            "Forms are how the web listens. You will learn `label` + `input` pairs, the input types that unlock the right mobile keyboards (`email`, `tel`, `number`), validation attributes like `required` and `pattern`, and why every control needs an accessible name. A well-built form halves your backend validation work.",
        },
      ],
    },
    {
      title: "CSS — Style",
      summary: "Layout, spacing and colour: making the skeleton beautiful.",
      lessons: [
        {
          title: "The Box Model & Spacing",
          kind: "text" as const,
          durationMinutes: 15,
          isPreview: false,
          content:
            "Every element is a box: content, padding, border, margin. You will internalise the box model by inspecting live sites, then use spacing scales (4/8/16/24) instead of random values. Consistent spacing is the single fastest way to make a page look professionally designed.",
        },
        {
          title: "Flexbox & Grid Layouts",
          kind: "text" as const,
          durationMinutes: 25,
          isPreview: false,
          content:
            "Flexbox arranges items along one axis; Grid places them in two. You will rebuild a nav bar with Flexbox, then a full page layout with Grid (`grid-template-columns`, `gap`, responsive `auto-fit`). By the end you will stop fighting layout and start composing it.",
        },
      ],
    },
    {
      title: "JavaScript — Behaviour",
      summary: "Variables, functions, the DOM and events.",
      lessons: [
        {
          title: "Variables, Functions & Control Flow",
          kind: "text" as const,
          durationMinutes: 20,
          isPreview: false,
          content:
            "JavaScript brings pages to life. You will declare variables with `const` and `let`, write functions that take inputs and return outputs, and control flow with `if` and loops. These five concepts are the grammar of every program you will ever write in this language.",
        },
        {
          title: "Selecting & Reacting: The DOM and Events",
          kind: "text" as const,
          durationMinutes: 25,
          isPreview: false,
          content:
            "The DOM is the live tree of your page. You will select elements with `querySelector`, change their text and classes, and respond to clicks and input events. You will finish by building a working counter and a live character counter — your first truly interactive components.",
        },
      ],
    },
    {
      title: "React — Components",
      summary: "Thinking in components: props, state and re-rendering.",
      lessons: [
        {
          title: "Components & Props",
          kind: "text" as const,
          durationMinutes: 20,
          isPreview: false,
          content:
            "React describes UI as functions of data. You will define components, pass data down through props, and compose small components into screens. The mental shift: instead of mutating the page, you describe what it should look like for any given data.",
        },
      ],
    },
    {
      title: "Backend — The Other Side",
      summary: "Servers, APIs and how the frontend talks to them.",
      lessons: [
        {
          title: "How APIs & JSON Work",
          kind: "text" as const,
          durationMinutes: 15,
          isPreview: false,
          content:
            "Every modern app is a conversation: the frontend asks, the backend answers — usually in JSON. You will read a real API response, understand request methods (GET/POST/PUT/DELETE), status codes (200/404/500), and call a public API with `fetch` from your own page.",
        },
      ],
    },
  ],
  quizOnLesson: "Selecting & Reacting: The DOM and Events",
  quiz: {
    title: "JavaScript Fundamentals Check",
    passScore: 70,
    questions: [
      {
        prompt: "Which keyword declares a variable whose value you will NOT reassign?",
        options: [
          { id: "a", text: "const" },
          { id: "b", text: "let" },
          { id: "c", text: "var" },
          { id: "d", text: "static" },
        ],
        correctOptionId: "a",
        explanation: "`const` declares a binding that cannot be reassigned — default to it, and reach for `let` only when you must reassign.",
      },
      {
        prompt: "What does `document.querySelector('.btn')` return?",
        options: [
          { id: "a", text: "All elements with class 'btn'" },
          { id: "b", text: "The FIRST element with class 'btn', or null" },
          { id: "c", text: "The element with id 'btn'" },
          { id: "d", text: "A CSS string" },
        ],
        correctOptionId: "b",
        explanation: "`querySelector` returns the first match (or null); `querySelectorAll` returns every match.",
      },
      {
        prompt: "Which method sends data to an API to CREATE something?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "POST" },
          { id: "c", text: "HEAD" },
          { id: "d", text: "OPTIONS" },
        ],
        correctOptionId: "b",
        explanation: "POST sends a body to create a resource; GET only reads.",
      },
    ],
  },
  resourceOnLesson: "Flexbox & Grid Layouts",
  resource: {
    title: "CSS Layout Cheat Sheet (MDN)",
    url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout",
    kind: "link" as const,
  },
};

/* ── Course 2: Digital Operations for SMEs ── */

const DIGITAL_OPS = {
  title: "Digital Operations for SMEs",
  slug: "digital-operations-for-smes",
  summary: "Stop running your business on paper and chat: digitise records, automate follow-ups and measure what matters.",
  description:
    "A practical operations course for small and growing businesses. You will map your daily workflow, move it into digital tools, automate the repetitive follow-ups, and define the handful of numbers that tell you the business is healthy.",
  level: "intermediate" as const,
  coverEmoji: "⚙️",
  published: true,
  sortOrder: 2,
  modules: [
    {
      title: "Digitise the Daily Workflow",
      summary: "From paper and WhatsApp chaos to one clear pipeline.",
      lessons: [
        {
          title: "Mapping Your Current Workflow",
          kind: "text" as const,
          durationMinutes: 15,
          isPreview: true,
          content:
            "You cannot digitise what you cannot describe. In this lesson you will draw your business as it actually runs today: every step a customer passes through, every place data is touched (paper, chat, memory). Most SMEs find at least three steps that exist only in someone's head — those are the first to fix.",
        },
        {
          title: "Choosing Tools That Stick",
          kind: "text" as const,
          durationMinutes: 20,
          isPreview: false,
          content:
            "Tools fail when they are chosen by hype. You will evaluate options against three honest questions: does my team already live in it, does it capture the data I actually act on, and can I leave it later with my data? We cover spreadsheets-as-a-starting-point, form-to-sheet flows, and when a CRM pays for itself.",
        },
      ],
    },
    {
      title: "Automate & Measure",
      summary: "Follow-ups that run themselves, numbers that guide the week.",
      lessons: [
        {
          title: "Automated Follow-Up Basics",
          kind: "text" as const,
          durationMinutes: 20,
          isPreview: false,
          content:
            "Every lead that goes cold is revenue walking away. You will design a three-touch follow-up sequence (instant acknowledgement, value-add on day 2, invitation on day 5) and wire it to run automatically. The lesson includes a template you can adapt to any service business.",
        },
        {
          title: "The Weekly Numbers Dashboard",
          kind: "text" as const,
          durationMinutes: 15,
          isPreview: false,
          content:
            "A business is steered by five numbers, not fifty. You will pick YOUR five (for most service SMEs: new leads, response time, conversion rate, revenue, repeat rate), define exactly how each is calculated, and set a 15-minute weekly review ritual around them.",
        },
      ],
    },
  ],
  quizOnLesson: "The Weekly Numbers Dashboard",
  quiz: {
    title: "Digital Operations Check",
    passScore: 70,
    questions: [
      {
        prompt: "What is the FIRST step of digitising a workflow?",
        options: [
          { id: "a", text: "Buying the most popular tool" },
          { id: "b", text: "Mapping the workflow as it runs today" },
          { id: "c", text: "Training the team on software" },
          { id: "d", text: "Hiring a consultant" },
        ],
        correctOptionId: "b",
        explanation: "You cannot digitise what you cannot describe — mapping exposes the hidden, head-only steps first.",
      },
      {
        prompt: "A healthy follow-up sequence for a new lead typically…",
        options: [
          { id: "a", text: "Sends one message and stops" },
          { id: "b", text: "Spans several touches with value in between" },
          { id: "c", text: "Messages daily until they reply" },
          { id: "d", text: "Waits for the lead to reach out" },
        ],
        correctOptionId: "b",
        explanation: "A cadence like instant → day 2 value-add → day 5 invitation keeps you present without pestering.",
      },
    ],
  },
};

const ANNOUNCEMENTS = [
  {
    title: "Welcome to Okomba Learning",
    body: "Welcome! Your dashboard shows everything in one place: continue where you left off, track your progress and watch for announcements like this one. Start with any preview lesson — no account needed to look around.",
    audience: "all" as const,
  },
  {
    title: "New quiz in Web Development Foundations",
    body: "A JavaScript Fundamentals Check has been added to the DOM & Events lesson. Pass it to lock in the module — retakes are unlimited.",
    audience: "course" as const,
    courseSlug: WEB_DEV.slug,
  },
];

/* ── idempotent seeding ─────────────────────────────────────── */

async function seedCourse(spec: typeof WEB_DEV | typeof DIGITAL_OPS) {
  const existing = await db.course.findUnique({ where: { slug: spec.slug }, select: { id: true } });
  if (existing) {
    console.log(`[seed-learning] course “${spec.slug}” exists — skipping`);
    return existing.id;
  }
  const course = await db.course.create({
    data: {
      title: spec.title,
      slug: spec.slug,
      summary: spec.summary,
      description: spec.description,
      level: spec.level,
      coverEmoji: spec.coverEmoji,
      published: spec.published,
      sortOrder: spec.sortOrder,
      priceNgn: 0,
    },
  });
  for (const [mIdx, m] of spec.modules.entries()) {
    const moduleRow = await db.module.create({
      data: {
        courseId: course.id,
        title: m.title,
        summary: m.summary,
        sortOrder: mIdx,
      },
    });
    for (const [lIdx, l] of m.lessons.entries()) {
      const lesson = await db.lesson.create({
        data: {
          moduleId: moduleRow.id,
          title: l.title,
          kind: l.kind,
          content: l.content,
          durationMinutes: l.durationMinutes,
          isPreview: l.isPreview,
          sortOrder: lIdx,
        },
      });
      if ("resourceOnLesson" in spec && spec.resourceOnLesson === l.title && "resource" in spec && spec.resource) {
        await db.lessonResource.create({
          data: {
            lessonId: lesson.id,
            title: spec.resource.title,
            url: spec.resource.url,
            kind: spec.resource.kind,
            sortOrder: 0,
          },
        });
        console.log(`[seed-learning]   resource → “${spec.resource.title}”`);
      }
      if ("quizOnLesson" in spec && spec.quizOnLesson === l.title && "quiz" in spec && spec.quiz) {
        await db.quiz.create({
          data: {
            lessonId: lesson.id,
            title: spec.quiz.title,
            passScore: spec.quiz.passScore,
            questions: {
              create: spec.quiz.questions.map((q, qi) => ({
                prompt: q.prompt,
                options: q.options,
                correctOptionId: q.correctOptionId,
                explanation: q.explanation,
                sortOrder: qi,
              })),
            },
          },
        });
        console.log(`[seed-learning]   quiz → “${spec.quiz.title}” (${spec.quiz.questions.length} questions)`);
      }
    }
  }
  console.log(`[seed-learning] course “${spec.slug}” seeded (${spec.modules.length} modules)`);
  return course.id;
}

async function main() {
  console.log("[seed-learning] starting…");
  const webDevId = await seedCourse(WEB_DEV);
  await seedCourse(DIGITAL_OPS);

  for (const a of ANNOUNCEMENTS) {
    const exists = await db.announcement.findFirst({ where: { title: a.title }, select: { id: true } });
    if (exists) {
      console.log(`[seed-learning] announcement “${a.title}” exists — skipping`);
      continue;
    }
    let courseId: string | null = null;
    if (a.audience === "course" && "courseSlug" in a && a.courseSlug) {
      const course = await db.course.findUnique({ where: { slug: a.courseSlug }, select: { id: true } });
      courseId = course?.id ?? null;
      if (!courseId) {
        console.warn(`[seed-learning] course slug not found for announcement: ${a.courseSlug}`);
        continue;
      }
    }
    await db.announcement.create({ data: { title: a.title, body: a.body, audience: a.audience, courseId } });
    console.log(`[seed-learning] announcement “${a.title}” seeded`);
  }
  const counts = {
    courses: await db.course.count(),
    modules: await db.module.count(),
    lessons: await db.lesson.count(),
    quizzes: await db.quiz.count(),
    questions: await db.quizQuestion.count(),
    announcements: await db.announcement.count(),
  };
  console.log("[seed-learning] done:", JSON.stringify(counts));
  void webDevId;
}

main()
  .catch((err) => {
    console.error("[seed-learning] FAILED", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
