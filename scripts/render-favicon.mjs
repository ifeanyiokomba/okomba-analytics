// Render the Okomba brand logo (public/logo.svg) to PNG favicons
// for cross-browser / iOS compatibility. SVG stays primary; PNGs are
// fallbacks for browsers that don't auto-handle SVG favicons well
// (older Safari, some Android browsers, apple-touch-icon).
import sharp from "sharp";
import { readFileSync } from "node:fs";

const SRC = "/home/z/my-project/public/logo.svg";
const svg = readFileSync(SRC);

const targets = [
  { out: "/home/z/my-project/public/apple-touch-icon.png", size: 180, bg: "#0B0F1A" },
  { out: "/home/z/my-project/public/favicon-32.png",       size: 32,  bg: { r: 0, g: 0, b: 0, alpha: 0 } },
  { out: "/home/z/my-project/public/favicon-16.png",       size: 16,  bg: { r: 0, g: 0, b: 0, alpha: 0 } },
  { out: "/home/z/my-project/public/og-image-logo.png",    size: 512, bg: "#0B0F1A" },
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size, { fit: "contain", background: t.bg })
    .png()
    .toFile(t.out);
  console.log(`✓ ${t.out} (${t.size}x${t.size})`);
}

console.log("Done.");
