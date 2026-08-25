import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* pdfkit loads .afm font data from node_modules at runtime — keep it
     external so the standalone build traces those files correctly. */
  serverExternalPackages: ["pdfkit"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
