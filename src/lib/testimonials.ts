/* ─────────────────────────────────────────────────────────────
   Testimonials — shared type + DB-row serializer (mirrors the
   pattern in lib/posts.ts: a flat model, so toTestimonial maps
   the row to a camelCase ISO-string payload for the API).
   ───────────────────────────────────────────────────────────── */

export type TestimonialStatus = "draft" | "published";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  service: string;
  text: string;
  rating: number;
  avatar: string | null;
  status: TestimonialStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/* ── Map a DB row to a typed Testimonial (for API responses) ─ */
export function toTestimonial(row: {
  id: string;
  name: string;
  role: string;
  service: string;
  text: string;
  rating: number;
  avatar: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): Testimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    service: row.service,
    text: row.text,
    rating: row.rating,
    avatar: row.avatar,
    status: (row.status === "draft" ? "draft" : "published") as TestimonialStatus,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
