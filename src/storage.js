import { DEFAULT_TESTIMONIALS, DEFAULT_BLOG_POSTS } from "../data/services.js";

const KEYS = {
  INQUIRIES:    "okomba_inquiries_v2",
  BLOG_POSTS:   "okomba_blog_v2",
  TESTIMONIALS: "okomba_testimonials_v2",
  SETTINGS:     "okomba_settings_v2",
};

// ─── INQUIRIES ────────────────────────────────────────────────
export const getInquiries = () => {
  try { return JSON.parse(localStorage.getItem(KEYS.INQUIRIES) || "[]"); }
  catch { return []; }
};

export const saveInquiry = (data) => {
  const list = getInquiries();
  const entry = { ...data, id: Date.now().toString(), timestamp: new Date().toISOString(), status: "new" };
  localStorage.setItem(KEYS.INQUIRIES, JSON.stringify([entry, ...list]));
  return entry;
};

export const updateInquiryStatus = (id, status) => {
  const list = getInquiries().map(i => i.id === id ? { ...i, status } : i);
  localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(list));
};

export const deleteInquiry = (id) => {
  const list = getInquiries().filter(i => i.id !== id);
  localStorage.setItem(KEYS.INQUIRIES, JSON.stringify(list));
};

export const exportInquiriesCSV = (inquiries) => {
  const headers = ["Date","Name","Email","Phone","WhatsApp","Service","Additional Service","Message","Status"];
  const rows = inquiries.map(i => [
    new Date(i.timestamp).toLocaleString(),
    i.name, i.email, i.phone, i.whatsapp || "",
    i.service, i.addlService || "", i.message, i.status || "new"
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `okomba-inquiries-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── BLOG POSTS ───────────────────────────────────────────────
export const getBlogPosts = (includeAll = false) => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.BLOG_POSTS) || "null");
    const posts = stored ?? DEFAULT_BLOG_POSTS;
    return includeAll ? posts : posts.filter(p => p.status === "published");
  } catch { return DEFAULT_BLOG_POSTS; }
};

export const saveBlogPost = (post) => {
  const all = getBlogPosts(true);
  const existing = all.findIndex(p => p.id === post.id);
  let updated;
  if (existing >= 0) {
    updated = all.map(p => p.id === post.id ? { ...post, updatedAt: new Date().toISOString() } : p);
  } else {
    const newPost = {
      ...post,
      id: `bp_${Date.now()}`,
      date: new Date().toISOString().slice(0,10),
      createdAt: new Date().toISOString(),
      author: "OKOMBA ANALYTICS",
      readTime: `${Math.max(1, Math.ceil(post.content.split(" ").length / 200))} min read`,
    };
    updated = [newPost, ...all];
  }
  localStorage.setItem(KEYS.BLOG_POSTS, JSON.stringify(updated));
  return updated;
};

export const deleteBlogPost = (id) => {
  const all = getBlogPosts(true).filter(p => p.id !== id);
  localStorage.setItem(KEYS.BLOG_POSTS, JSON.stringify(all));
};

export const getBlogPostBySlug = (slug) => {
  return getBlogPosts(true).find(p => p.slug === slug) || null;
};

// ─── TESTIMONIALS ─────────────────────────────────────────────
export const getTestimonials = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.TESTIMONIALS) || "null");
    return stored ?? DEFAULT_TESTIMONIALS;
  } catch { return DEFAULT_TESTIMONIALS; }
};

export const saveTestimonials = (testimonials) => {
  localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(testimonials));
};

// ─── SETTINGS ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  phone: "+2348088948657",
  whatsapp: "+2348088948657",
  email: "support@okomba.com",
  address: "Nigeria",
};

export const getSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || "null");
    return { ...DEFAULT_SETTINGS, ...(stored || {}) };
  } catch { return DEFAULT_SETTINGS; }
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// ─── HELPERS ──────────────────────────────────────────────────
export const generateSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
