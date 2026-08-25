/* Local webhook capture server — records payloads POSTed by the notify
   engine so E2E tests can assert the exact Google Apps Script contract. */
import http from "node:http";
import fs from "node:fs";

const OUT = "/tmp/captured-payloads.json";
const payloads = [];

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const entry = {
        at: new Date().toISOString(),
        url: req.url,
        headers: { "content-type": req.headers["content-type"] },
        body: body.length > 4_000_000 ? `<<${body.length} bytes>>` : safeJson(body),
      };
      payloads.push(entry);
      fs.writeFileSync(OUT, JSON.stringify(payloads, null, 2));
      console.log(`[capture] ${req.url} — ${body.length} bytes`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  })
  .listen(9999, () => console.log("[capture] listening on :9999"));

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
