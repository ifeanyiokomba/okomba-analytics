import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* pdfkit + exceljs load .afm font / zip data from node_modules at
     runtime — keep them external so the standalone build traces
     those files correctly. */
  serverExternalPackages: ["pdfkit", "exceljs"],
  /* Audit fix (Phase 27): ignoreBuildErrors was true — let TypeScript
     errors block production builds. A payment/CRM system must not ship
     with type errors. ESLint config lives in eslint.config.mjs. */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
