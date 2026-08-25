import PDFDocument from "pdfkit";
import fs from "node:fs";

const doc = new PDFDocument({ size: "A4", margin: 50 });
const chunks: Buffer[] = [];
doc.on("data", (c: Buffer) => chunks.push(c));
const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

doc.font("public/fonts/NotoSans-Regular.ttf").fontSize(14).text("Naira test: \u20A6450,000 — Regular OK");
doc.font("public/fonts/NotoSans-Bold.ttf").fontSize(14).text("Naira test: \u20A6450,000 — Bold OK");
doc.image("public/images/logo.png", 50, 200, { width: 160 });
doc.end();
const buf = await done;
fs.writeFileSync("/tmp/test.pdf", buf);
console.log("PDF bytes:", buf.length, "| starts:", buf.subarray(0, 8).toString());
