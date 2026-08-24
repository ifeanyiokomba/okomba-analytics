/* The admin portal is now modularised under ./admin/.
   This file preserves the existing import path
   `import { AdminPortal } from "@/components/site/admin-portal"`
   consumed by src/app/page.tsx via dynamic import. */
export { AdminPortal } from "./admin";
