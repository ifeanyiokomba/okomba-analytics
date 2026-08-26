"use client";

/**
 * Thin re-export shim — the server route at
 * /portal/[secureToken] imports `ClientPortalView` from this path so the
 * page can swap implementations without touching the route file.
 *
 * The actual implementation lives in ./client-portal.tsx.
 */

export { ClientPortalView } from "./client-portal";
