/* ─────────────────────────────────────────────────────────────
   Okomba Analytics — Content Library
   Services, products, case studies, testimonials & insights.
   Service data preserved from the original repository audit.
   ───────────────────────────────────────────────────────────── */

export type Service = {
  id: string;
  title: string;
  icon: string; // lucide icon key, resolved in components
  desc: string;
  tags: string[];
  subs: string[];
  benefits: string[];
  idealFor: string[];
  category: string;
};

export const SERVICES: Service[] = [
  {
    id: "web-dev",
    title: "Web & Mobile App Development",
    icon: "code",
    desc: "Custom digital solutions from concept to deployment — web, mobile, and full-stack.",
    tags: ["Web Apps", "Mobile", "Full-Stack", "Fintech"],
    subs: [
      "Custom Web Application Development",
      "Mobile App Development",
      "Full-Stack Development",
      "Business Website Development",
      "Responsive Website Design",
      "Startup Product Development",
      "Admin Dashboard Development",
      "Fintech Solution Development",
    ],
    benefits: ["Fast delivery timelines", "Scalable architecture", "Modern tech stack", "Post-launch support"],
    idealFor: ["Startups", "SMEs", "NGOs", "Enterprises"],
    category: "Technology",
  },
  {
    id: "fintech",
    title: "Fintech & Digital Payment Services",
    icon: "wallet",
    desc: "Comprehensive digital payment operations — local and international transfer coordination.",
    tags: ["Remita", "Quickteller", "Payments", "Finance"],
    subs: [
      "Remita Payment Processing",
      "Quickteller Payment Support",
      "Bill Payment Services",
      "Local Fund Transfer Coordination",
      "International Fund Transfer Support",
      "Financial Workflow Management",
    ],
    benefits: ["Fast processing", "Secure transactions", "Multiple payment channels", "Expert guidance"],
    idealFor: ["Businesses", "Schools", "Government agencies", "NGOs"],
    category: "Finance",
  },
  {
    id: "payment-int",
    title: "Payment System Integration",
    icon: "zap",
    desc: "Seamless payment gateway integration and digital payment infrastructure setup.",
    tags: ["Gateway", "Integration", "Collection", "Automation"],
    subs: [
      "Payment Gateway Integration",
      "Digital Payment Setup",
      "Payment Collection Systems",
      "International Payment Infrastructure",
      "Fintech Operations Support",
    ],
    benefits: ["Reduced friction", "Automated reconciliation", "Multi-currency support", "Compliance ready"],
    idealFor: ["E-commerce", "SaaS companies", "Marketplaces", "Service platforms"],
    category: "Finance",
  },
  {
    id: "digital-ops",
    title: "Digital Operations & Admin Support",
    icon: "settings",
    desc: "End-to-end digital workflow management and administrative coordination.",
    tags: ["Workflow", "Documentation", "Scheduling", "Operations"],
    subs: [
      "Digital Workflow Management",
      "Administrative Coordination",
      "Documentation Management",
      "Scheduling Systems",
      "Workflow Optimization",
    ],
    benefits: ["Reduced overhead", "Streamlined processes", "Better team coordination", "Time savings"],
    idealFor: ["Remote teams", "SMEs", "Agencies", "Consultancies"],
    category: "Operations",
  },
  {
    id: "events",
    title: "Event & Program Coordination",
    icon: "calendar",
    desc: "Virtual and physical event management with registration and logistics support.",
    tags: ["Virtual Events", "Registration", "Certificates", "Logistics"],
    subs: [
      "Virtual Event Coordination",
      "Physical Event Management",
      "Participant Registration Systems",
      "Certificate Distribution",
      "Event Logistics",
    ],
    benefits: ["Seamless execution", "Professional attendee experience", "Automated registration", "Post-event reporting"],
    idealFor: ["Organizations", "Schools", "NGOs", "Corporate teams"],
    category: "Operations",
  },
  {
    id: "education",
    title: "Educational & Online Application Support",
    icon: "book",
    desc: "Guided support for JAMB, scholarship, admission, and educational portal applications.",
    tags: ["JAMB", "Admissions", "Scholarships", "Applications"],
    subs: [
      "JAMB Registration Assistance",
      "Educational Applications",
      "Scholarship Application Support",
      "Admission Portal Guidance",
    ],
    benefits: ["Expert guidance", "Error-free submissions", "Deadline management", "Stress-free process"],
    idealFor: ["Students", "Parents", "Guardians", "Educational consultants"],
    category: "Education",
  },
  {
    id: "video",
    title: "Video Design & Media Services",
    icon: "video",
    desc: "Professional video editing, motion graphics, and multimedia content production.",
    tags: ["Video Editing", "Motion Graphics", "Social Media", "Promos"],
    subs: [
      "Video Editing",
      "Promotional Video Creation",
      "Motion Graphics",
      "Social Media Video Content",
      "Event Media Production",
    ],
    benefits: ["Cinematic quality", "Fast turnaround", "Brand-consistent style", "Multiple formats"],
    idealFor: ["Brands", "Creators", "NGOs", "Event organizers"],
    category: "Creative",
  },
  {
    id: "graphic",
    title: "Graphic Design & Brand Support",
    icon: "palette",
    desc: "Premium design services for CVs, branding, marketing materials, and presentations.",
    tags: ["CVs", "Flyers", "Branding", "Marketing"],
    subs: [
      "Resume/CV Design",
      "Flyers & Banners",
      "Brand Materials",
      "Presentation Design",
      "Marketing Assets",
    ],
    benefits: ["Stand-out designs", "Brand consistency", "Print & digital formats", "Quick revisions"],
    idealFor: ["Job seekers", "Businesses", "Professionals", "Marketers"],
    category: "Creative",
  },
  {
    id: "research",
    title: "Research, Data & Documentation",
    icon: "database",
    desc: "Structured data analysis, research support, and professional documentation services.",
    tags: ["Data Analysis", "Reports", "Documentation", "Records"],
    subs: [
      "Data Analysis",
      "Information Management",
      "Report Preparation",
      "Documentation Support",
      "Records Organization",
    ],
    benefits: ["Accurate insights", "Well-structured reports", "Organized records", "Data-driven decisions"],
    idealFor: ["Researchers", "Academics", "Businesses", "Analysts"],
    category: "Operations",
  },
  {
    id: "training",
    title: "Training & Digital Facilitation",
    icon: "graduation",
    desc: "ICT training, digital literacy programs, and technology mentorship for youth.",
    tags: ["ICT Training", "Digital Literacy", "Mentorship", "Tech"],
    subs: [
      "ICT Training",
      "Digital Literacy Training",
      "Technical Guidance",
      "Computer Studies Instruction",
      "Youth Mentorship",
    ],
    benefits: ["Practical skills", "Hands-on learning", "Experienced facilitators", "Customized curriculum"],
    idealFor: ["Schools", "Youth organizations", "NGOs", "Community groups"],
    category: "Education",
  },
  {
    id: "healthcare",
    title: "Healthcare & Laboratory Support",
    icon: "heart",
    desc: "Clinical documentation, laboratory assistance, and diagnostic support services.",
    tags: ["Laboratory", "Clinical Docs", "Diagnostics", "Healthcare"],
    subs: [
      "Laboratory Assistance",
      "Clinical Documentation",
      "Diagnostic Support",
      "Sample Handling Support",
    ],
    benefits: ["Accurate documentation", "Efficient workflows", "Professional standards", "Confidential handling"],
    idealFor: ["Clinics", "Labs", "Hospitals", "Healthcare providers"],
    category: "Healthcare",
  },
  {
    id: "tech-support",
    title: "Technical & Digital Support",
    icon: "headphones",
    desc: "Responsive technical support, software assistance, and technology consultation.",
    tags: ["Tech Support", "Software", "Troubleshooting", "Consultation"],
    subs: [
      "Technical Support",
      "Software Assistance",
      "Digital Troubleshooting",
      "Technology Consultation",
    ],
    benefits: ["Fast response", "Expert resolution", "Remote support available", "Clear communication"],
    idealFor: ["Businesses", "Individuals", "Teams", "Non-tech founders"],
    category: "Technology",
  },
  {
    id: "consulting",
    title: "Business & Digital Consultation",
    icon: "briefcase",
    desc: "Strategic guidance for digital transformation, startup growth, and automation.",
    tags: ["Consulting", "Startups", "Automation", "Strategy"],
    subs: [
      "Digital Solutions Consultation",
      "Startup Technology Guidance",
      "Business Operations Consultation",
      "Automation Consultation",
    ],
    benefits: ["Strategic clarity", "Proven frameworks", "Actionable roadmap", "Expert perspective"],
    idealFor: ["Startups", "SMEs", "Executives", "Founders"],
    category: "Business",
  },
  {
    id: "client-acq",
    title: "Client Acquisition & Business Support",
    icon: "users",
    desc: "Automated lead collection, client onboarding, and communication workflow systems.",
    tags: ["Lead Generation", "Onboarding", "Automation", "CRM"],
    subs: [
      "Lead Collection Systems",
      "Client Onboarding",
      "Automated Communication Systems",
      "Customer Workflow Support",
    ],
    benefits: ["More qualified leads", "Streamlined onboarding", "Automated follow-up", "Better conversion"],
    idealFor: ["Sales teams", "Agencies", "Coaches", "Service providers"],
    category: "Business",
  },
];

export const CATEGORIES = [
  "All",
  "Technology",
  "Finance",
  "Operations",
  "Creative",
  "Education",
  "Business",
  "Healthcare",
] as const;

/* ── Products / Solutions (real Okomba platforms) ──────────── */
export type Product = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  desc: string;
  points: string[];
  icon: string;
  accent: "gold" | "teal" | "blue";
  link?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "turbopay",
    name: "Turbopay",
    tagline: "Payments, at turbo speed",
    category: "Payments Platform",
    desc: "A fast, reliable payment platform for modern businesses — collections, transfers and payment processing built for Nigeria's digital economy.",
    points: ["Fast collections & transfers", "Business payment processing", "Built for Nigerian rails"],
    icon: "wallet",
    accent: "gold",
    link: "https://turbopay.okomba.com",
  },
  {
    id: "billswift",
    name: "BillSwift",
    tagline: "Bills paid in seconds",
    category: "Bill Payments Platform",
    desc: "Swift bill payments — airtime, data, utilities and more — with instant confirmation and clean transaction records.",
    points: ["Airtime, data & utilities", "Instant confirmation", "Clean transaction records"],
    icon: "zap",
    accent: "teal",
  },
  {
    id: "trustscore",
    name: "TrustScore",
    tagline: "Know who you're dealing with",
    category: "Identity Verification",
    desc: "Identity verification and trust scoring for businesses that need to validate customers quickly and confidently.",
    points: ["Identity verification", "Trust scoring", "Fraud-aware checks"],
    icon: "shield",
    accent: "blue",
  },
  {
    id: "omniscore",
    name: "Omniscore CPaaS",
    tagline: "Every channel. One platform.",
    category: "Communications Platform",
    desc: "A communications platform-as-a-service for bulk SMS, messaging, voice, WhatsApp, Telegram and OTP verification — every channel behind one platform.",
    points: ["Bulk SMS & messaging", "Voice, WhatsApp & Telegram", "OTP verification"],
    icon: "workflow",
    accent: "gold",
  },
  {
    id: "votewise",
    name: "Votewise",
    tagline: "Elections people trust",
    category: "Voting Platform",
    desc: "A digital voting and election management platform delivering secure polls and real-time results.",
    points: ["Secure digital voting", "Real-time results", "Election management"],
    icon: "clipboard",
    accent: "teal",
    link: "https://votewise.com.ng",
  },
  {
    id: "sanctum",
    name: "Sanctum Multipurpose",
    tagline: "One platform, many purposes",
    category: "Multipurpose Platform",
    desc: "A versatile multipurpose platform built to serve the varied operational needs of modern organizations.",
    points: ["Multipurpose operations", "Modular capabilities", "Organization-ready"],
    icon: "layers",
    accent: "blue",
  },
];

/* ── Projects we've worked on (real) ──────────────────────── */
export type Project = {
  id: string;
  name: string;
  category: string;
  link?: string;
  image: string;
  tagline: string;
  overview: string;
  built: string[];
  tags: string[];
};

export const PROJECTS: Project[] = [
  {
    id: "p-votewise",
    name: "Votewise",
    category: "Voting & Elections",
    link: "https://votewise.com.ng",
    image: "/images/case-edubridge.png",
    tagline: "Elections people trust",
    overview:
      "Votewise is a digital voting and election management platform — secure polls, transparent processes and real-time results for organizations that run credible elections.",
    built: ["Secure digital voting engine", "Real-time results & audit trail", "Election management console"],
    tags: ["Voting", "Elections", "Platform"],
  },
  {
    id: "p-turbopay",
    name: "Turbopay",
    category: "Fintech · Payments",
    link: "https://turbopay.okomba.com",
    image: "/images/case-finflow.png",
    tagline: "Payments, at turbo speed",
    overview:
      "Turbopay is our payments platform — fast collections, transfers and business payment processing built for Nigeria's digital economy.",
    built: ["Collections & transfers", "Business payment processing", "Merchant-ready APIs"],
    tags: ["Payments", "Fintech", "Transfers"],
  },
  {
    id: "p-billswift",
    name: "BillSwift",
    category: "Bill Payments",
    image: "/images/case-techstart.png",
    tagline: "Bills paid in seconds",
    overview:
      "BillSwift makes bill payments swift — airtime, data, utilities and more, with instant confirmation and clean records for every transaction.",
    built: ["Airtime, data & utility bills", "Instant confirmation flow", "Transaction history & records"],
    tags: ["Bills", "Airtime", "Utilities"],
  },
  {
    id: "p-trustscore",
    name: "TrustScore",
    category: "Identity Verification",
    image: "/images/project-trustscore.png",
    tagline: "Know who you're dealing with",
    overview:
      "TrustScore delivers identity verification and trust scoring — helping businesses validate customers quickly, confidently and with fraud-aware checks.",
    built: ["Identity verification engine", "Trust scoring system", "Fraud-aware validation"],
    tags: ["KYC", "Identity", "Trust"],
  },
  {
    id: "p-omniscore",
    name: "Omniscore CPaaS",
    category: "Communications",
    image: "/images/project-omniscore.png",
    tagline: "Every channel. One platform.",
    overview:
      "Omniscore is our communications platform-as-a-service — bulk SMS, messaging, voice, WhatsApp, Telegram and OTP verification, unified behind one platform.",
    built: ["Bulk SMS & messaging", "Voice, WhatsApp & Telegram", "OTP verification"],
    tags: ["CPaaS", "SMS", "OTP"],
  },
  {
    id: "p-sanctum",
    name: "Sanctum Multipurpose",
    category: "Multipurpose Platform",
    image: "/images/project-sanctum.png",
    tagline: "One platform, many purposes",
    overview:
      "Sanctum is a versatile multipurpose platform — modular capabilities that adapt to the varied operational needs of modern organizations.",
    built: ["Modular capability system", "Multipurpose operations", "Organization-ready tooling"],
    tags: ["Platform", "Modular", "Operations"],
  },
];


/* ── Testimonials (from original repository) ──────────────── */
export const TESTIMONIALS = [
  {
    id: "t1",
    name: "Chukwuemeka Obi",
    role: "Founder, TechStartNG",
    avatar: "/images/avatar-chukwuemeka.png",
    text: "OKOMBA ANALYTICS transformed our digital operations completely. The web app they built for us exceeded every expectation — professional, fast, and beautifully designed.",
    rating: 5,
    service: "Web Development",
  },
  {
    id: "t2",
    name: "Adaeze Nwosu",
    role: "Director, EduBridge Foundation",
    avatar: "/images/avatar-adaeze.png",
    text: "Their event coordination service is world-class. They managed our entire virtual summit seamlessly — from registration to certificate distribution. Absolutely flawless execution.",
    rating: 5,
    service: "Event Coordination",
  },
  {
    id: "t3",
    name: "Ibrahim Suleiman",
    role: "CEO, FinFlow Nigeria",
    avatar: "/images/avatar-ibrahim.png",
    text: "The payment integration support was exceptional. Complex Remita and gateway setups handled effortlessly. Our transaction processing is now fully automated.",
    rating: 5,
    service: "Payment Integration",
  },
];

/* ── Process ──────────────────────────────────────────────── */
export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Discover",
    desc: "We start by understanding your business, your users and the outcome you actually need — not just the feature list.",
  },
  {
    step: "02",
    title: "Strategize",
    desc: "We define the right solution and architecture, with a clear scope, timeline and delivery plan.",
  },
  {
    step: "03",
    title: "Design",
    desc: "We build the experience and system blueprint — interfaces, workflows and data structure.",
  },
  {
    step: "04",
    title: "Build",
    desc: "We develop and integrate the solution in disciplined iterations, with progress you can see.",
  },
  {
    step: "05",
    title: "Launch",
    desc: "We test, deploy and optimize — pressure-checking every flow before it faces your customers.",
  },
  {
    step: "06",
    title: "Grow",
    desc: "We continue improving the product after launch, with support that doesn't disappear.",
  },
];

/* ── Why Okomba ───────────────────────────────────────────── */
export const DIFFERENTIATORS = [
  {
    icon: "target",
    title: "Business-first, not tech-first",
    desc: "Every recommendation starts from your revenue, operations and users — technology is the means, not the pitch.",
  },
  {
    icon: "layers",
    title: "One partner, full stack",
    desc: "Strategy, design, engineering, payments and operations under one roof — no vendor juggling on your side.",
  },
  {
    icon: "gauge",
    title: "Built for real budgets",
    desc: "Cost-conscious execution: phased delivery, lean architecture and no gold-plating you didn't ask for.",
  },
  {
    icon: "shield",
    title: "Serious about security",
    desc: "Secure transactions, protected data and confidentiality handled with professional standards.",
  },
  {
    icon: "handshake",
    title: "Support beyond launch",
    desc: "Delivery is the beginning. We stay on to maintain, improve and grow what we build with you.",
  },
  {
    icon: "sparkles",
    title: "Craft in the details",
    desc: "Design precision, clean code and polished micro-interactions — the details users feel but can't name.",
  },
];

/* ── Insights (blog posts from original repository) ───────── */
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  author: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "bp1",
    title: "Why Nigerian Businesses Need a Digital Operations Strategy in 2025",
    slug: "nigerian-businesses-digital-operations-2025",
    excerpt:
      "Digital transformation is no longer optional for businesses in Nigeria. Here's what you need to know to stay competitive.",
    content: `## The Digital Shift is Here

The Nigerian business landscape is evolving rapidly. Companies that embrace digital operations are growing 2-3x faster than those still relying on manual processes.

## What Is a Digital Operations Strategy?

A digital operations strategy is a comprehensive plan for automating, digitizing, and optimizing your business workflows using technology. It covers everything from customer acquisition to payment processing, documentation, and team coordination.

## Key Areas to Digitize

**1. Customer Communication**
Replace manual follow-ups with automated email and WhatsApp workflows. This alone can save your team 10+ hours per week.

**2. Payment Processing**
Integrate payment gateways like Remita, Paystack, or Flutterwave to automate collections and reconciliation.

**3. Documentation & Records**
Move from physical files to cloud-based documentation systems. This improves access, security, and efficiency.

**4. Data & Reporting**
Automated reporting dashboards give you real-time visibility into your business performance without manual data entry.

## Getting Started

The best way to start is with a digital audit — understanding where your current inefficiencies are and which technology solutions will have the most impact.

OKOMBA ANALYTICS specializes in helping Nigerian businesses develop and execute digital strategies tailored to their specific needs and budget.

**Ready to transform your operations? Contact us today.**`,
    category: "Business",
    tags: ["Digital Transformation", "Nigeria", "Operations"],
    date: "2025-01-15",
    readTime: "4 min read",
    author: "OKOMBA ANALYTICS",
  },
  {
    id: "bp2",
    title: "Complete Guide to JAMB Registration 2025: Avoiding Common Mistakes",
    slug: "jamb-registration-guide-2025",
    excerpt:
      "JAMB registration can be stressful. This complete guide walks you through every step and common pitfalls to avoid.",
    content: `## JAMB 2025 Registration — Everything You Need to Know

Every year, thousands of students face challenges during JAMB registration due to errors, technical issues, or missing requirements. This guide will help you navigate the process smoothly.

## Requirements Before You Start

Before logging on to the JAMB portal, ensure you have:

- Valid NIN (National Identification Number)
- Valid email address (that you have access to)
- Passport photograph (white background, formal attire)
- Payment of registration fees

## Step-by-Step Registration Process

**Step 1: Create Your Profile**
Visit the JAMB portal and create your candidate profile. Use your NIN to verify your identity.

**Step 2: Choose Your Subjects**
Select your 4 UTME subjects based on your intended course of study. Confirm subject combinations for your chosen institution.

**Step 3: Select Your Institution**
Choose your first and second choice universities and courses carefully. Research admission requirements before selecting.

**Step 4: Upload Your Photo**
Your passport photo must meet JAMB's specifications. Blurry or non-compliant photos are a common cause of registration failure.

**Step 5: Make Payment**
Pay through authorized vendors or online channels only. Keep your receipt/confirmation safe.

## Common Mistakes to Avoid

- Using incorrect personal information (name must match NIN exactly)
- Choosing subjects incompatible with your course
- Uploading low-quality passport photos
- Not verifying your email address

## Need Professional Assistance?

OKOMBA ANALYTICS provides guided JAMB registration support. Our team ensures your application is error-free and submitted correctly.`,
    category: "Education",
    tags: ["JAMB", "Education", "Nigeria", "Students"],
    date: "2025-01-08",
    readTime: "5 min read",
    author: "OKOMBA ANALYTICS",
  },
  {
    id: "bp3",
    title: "How to Choose the Right Payment Gateway for Your Nigerian Business",
    slug: "payment-gateway-guide-nigeria",
    excerpt:
      "Paystack, Flutterwave, Remita, or Quickteller? We break down the best payment options for Nigerian businesses.",
    content: `## Choosing the Right Payment Gateway

Payment processing is critical for any Nigerian business operating online. The wrong choice can cost you customers, while the right one can dramatically increase conversion rates.

## The Major Players

**Paystack**
Best for: E-commerce, SaaS, small-medium businesses
Key features: Easy integration, excellent developer documentation, instant settlement options

**Flutterwave**
Best for: International businesses, cross-border payments
Key features: Multi-currency support, global card acceptance, business tools

**Remita**
Best for: Government agencies, educational institutions, large organizations
Key features: Government-grade security, multi-bank collection, direct debit

**Quickteller**
Best for: Consumer-facing businesses, bill payments
Key features: Wide reach, popular consumer brand, extensive bank coverage

## Factors to Consider

1. **Transaction fees** — Compare percentage and flat fees per transaction
2. **Settlement time** — How quickly funds hit your account
3. **Integration complexity** — Can your team implement it?
4. **International support** — Do you need to accept USD/GBP?
5. **Customer experience** — What does the checkout look like for your users?

## Our Recommendation

For most Nigerian SMEs starting out, **Paystack** offers the best combination of ease of use, developer support, and competitive fees.

For businesses needing government payment processing, **Remita** is the clear choice.

OKOMBA ANALYTICS can handle the entire payment integration process for you — from gateway selection to full implementation and testing.`,
    category: "Finance",
    tags: ["Payments", "Fintech", "Nigeria", "Business"],
    date: "2024-12-20",
    readTime: "6 min read",
    author: "OKOMBA ANALYTICS",
  },
  {
    id: "bp4",
    title: "Automating Business Workflows: Where Nigerian SMEs Should Start",
    slug: "automating-business-workflows-nigerian-smes",
    excerpt:
      "Automation pays for itself fastest where manual work repeats daily. A practical starting sequence for small teams.",
    content: `## Start Where the Repetition Hurts

Most SMEs don't need automation everywhere — they need it in the two or three places where the same manual task repeats every single day. Finding those places takes one week of honest observation.

## The Starting Sequence

**1. Customer follow-ups**
Every lead that goes cold is revenue walking away. Automated email and WhatsApp sequences ensure nobody is forgotten while your team sleeps. This is usually the fastest payback of any automation investment.

**2. Payment collection and reconciliation**
If someone on your team manually confirms transfers or matches payments to customers, that's hours lost daily and errors waiting to happen. Gateway integration with automated reconciliation removes both.

**3. Registration and onboarding forms**
Collecting customer information over phone calls and chat messages produces messy data. Structured forms feeding a database produce clean, actionable records.

**4. Reports and dashboards**
Once your data flows through systems rather than inboxes, dashboards become almost free. Decision-making improves because you finally see the business in real time.

## What NOT to Automate First

Avoid automating processes that are broken or undocumented. Automating chaos gives you faster chaos. Map the process on paper, remove the pointless steps, then automate what remains.

## The Realistic Budget

A focused automation project — forms, follow-ups, one integration — typically costs a fraction of what the manual work costs in salaries over a year. The math is rarely close.

OKOMBA ANALYTICS helps SMEs identify their highest-ROI automation targets and implements them end-to-end. Start with a discovery conversation.`,
    category: "Operations",
    tags: ["Automation", "SMEs", "Workflow", "Nigeria"],
    date: "2025-02-10",
    readTime: "5 min read",
    author: "OKOMBA ANALYTICS",
  },
  {
    id: "bp5",
    title: "A Founder's Guide to Specifying a Web Application That Gets Built Right",
    slug: "founders-guide-specifying-web-application",
    excerpt:
      "The gap between what founders imagine and what developers build is where projects fail. Close it with a better brief.",
    content: `## Most Project Failures Are Specification Failures

When a web project disappoints, the code is rarely the culprit. The brief was vague, the priorities were unstated, and success was never defined. Here's how to prevent that.

## The Six Things Every Brief Needs

**1. The business outcome — not the feature list**
"I need a booking system" is a feature. "I need to cut appointment no-shows by half" is an outcome. Good engineers design differently when they know what success actually measures.

**2. The users, described precisely**
Not "customers" — but who they are, what device they use, how tech-savvy they are, and what they're doing the minute before they touch your product.

**3. The three flows that matter**
List the three user journeys that must work perfectly on day one. Everything else can iterate. This single discipline prevents scope explosion.

**4. Honest constraints**
Budget, deadline, existing systems, compliance needs — state them upfront. Constraints stated early are design inputs; constraints revealed late are change orders.

**5. What you explicitly don't want**
"I don't need an app, a responsive web app is fine" saves weeks. Negative scope is as valuable as positive scope.

**6. Your definition of "done"**
Is it launch? Is it 100 users? Is it the first payment processed? Agree on it in writing.

## Red Flags in Your Own Brief

- Every feature is "critical"
- No user description exists
- The timeline was set before the scope
- Nobody can state the one metric that proves the project worked

## Working With a Technical Partner

Share the brief, then let the engineering team respond with a proposed architecture, phased plan and honest trade-offs. A partner who only says yes to everything is telling you something.

OKOMBA ANALYTICS runs structured discovery on every engagement — because the brief is the product.`,
    category: "Technology",
    tags: ["Web Development", "Startups", "Product", "Founders"],
    date: "2025-02-24",
    readTime: "6 min read",
    author: "OKOMBA ANALYTICS",
  },
];

/* ── Contact info (from original repository) ──────────────── */
export const CONTACT = {
  email: "support@okomba.com",
  phone: "+234 808 894 8657",
  phoneHref: "tel:+2348088948657",
  whatsapp: "https://wa.me/2348088948657",
};

export const TICKER_ITEMS = [
  "Web Development",
  "Fintech Solutions",
  "Payment Integration",
  "Digital Operations",
  "Event Coordination",
  "Educational Support",
  "Video Production",
  "Graphic Design",
  "Data Research",
  "ICT Training",
  "Healthcare Support",
  "Technical Assistance",
  "Business Consulting",
  "Client Acquisition",
];

/* ── FAQ ──────────────────────────────────────────────────── */
export const FAQS = [
  {
    q: "How quickly can we start a project?",
    a: "Most engagements begin within 3–5 working days of an accepted proposal. For urgent needs — payment outages, event registrations with deadlines — we keep an express lane and can often start the same week.",
  },
  {
    q: "How much does a typical project cost?",
    a: "Scope drives price. A business website starts smaller; a custom web application or payment integration is engineered to your requirements. We quote fixed, phased budgets after a free discovery call — no open-ended billing surprises.",
  },
  {
    q: "Do you work with clients outside Nigeria?",
    a: "Yes. While we're based in Nigeria and deeply familiar with local rails (Remita, Quickteller, Paystack, Flutterwave), we serve clients globally over WhatsApp, email and video calls — with overlap hours arranged for your timezone.",
  },
  {
    q: "What happens after launch — do you disappear?",
    a: "No. Every project ships with a support window, and most clients keep us on a maintenance retainer. We monitor, fix, improve and grow what we build — delivery is the beginning of the relationship, not the end.",
  },
  {
    q: "Can you take over a project another team started?",
    a: "Yes — it's a common engagement. We start with a technical audit of the existing code and infrastructure, give you an honest assessment of what's salvageable, then plan the path forward. You keep full ownership of everything.",
  },
  {
    q: "How is my data and payment information handled?",
    a: "We follow professional security standards: encrypted communication, secure gateway integrations, least-privilege access and strict confidentiality. We never share client data, and payment processing runs through certified providers — never through us.",
  },
  {
    q: "What do you need from me to get started?",
    a: "A short conversation about your goal, your timeline and your budget range. From there we handle discovery, planning and execution — you stay involved at decision points without being buried in technical detail.",
  },
];


