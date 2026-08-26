/**
 * Okomba Analytics — WhatsApp transport mini-service (Module 6).
 *
 * Port: 3004 (fixed — the Caddy gateway forwards /?XTransformPort=3004).
 *
 * ARCHITECTURE
 *   • This service OWNS the WhatsApp Web session (whatsapp-web.js +
 *     puppeteer, LocalAuth in ./data/session) and the socket.io
 *     channel for live admin updates (QR, status, messages).
 *   • It NEVER touches the app database — every inbound/queued
 *     message is persisted by the Next.js app via internal HTTP
 *     (X-Internal-Token), keeping whatsapp_messages the single
 *     source of truth for chat history.
 *
 * MODES (WHATSAPP_MODE=auto|real|demo, default auto)
 *   real — whatsapp-web.js with a real QR to scan from the admin
 *          widget. Production path.
 *   demo — simulated session (scan/connected/sends/replies) so the
 *          full widget UX is testable without a phone. Auto-falls
 *          back to this when puppeteer/Chrome or the WhatsApp Web
 *          connection is unavailable (e.g. sandbox CI).
 */

import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3004; // REST (server-to-server with the Next.js app)
const SOCKET_PORT = 3005; // socket.io for the browser (via gateway /?XTransformPort=3005)
const MODE = (process.env.WHATSAPP_MODE || "auto").toLowerCase(); // auto | real | demo
const MAIN_APP_URL = (process.env.MAIN_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const INTERNAL_TOKEN = process.env.WHATSAPP_INTERNAL_TOKEN || "okomba-internal-dev";
const QR_BOOT_TIMEOUT_MS = Number(process.env.QR_BOOT_TIMEOUT_MS || 45_000);

/* ── Service state ─────────────────────────────────────────── */

const state = {
  mode: MODE === "demo" ? "demo" : "initializing", // initializing | real | demo
  status: "disconnected", // connecting | connected | disconnected
  qr: null, // data-URL of the current QR to scan
  phone: null, // MSISDN of the connected business number
  client: null, // whatsapp-web.js Client (real mode)
  bootedAt: new Date().toISOString(),
};

/* ── HTTP + socket plumbing ────────────────────────────────── */

/* NOTE ON PORTS: socket.io must be served at path "/" for the Caddy
   gateway — but engine.io at "/" intercepts every request, so REST
   and socket.io CANNOT share a listener. REST lives on :3004 (called
   server-to-server by the Next.js app), the browser-facing socket on
   :3005 (io("/?XTransformPort=3005")). */

const app = express();
app.use(express.json({ limit: "32mb" })); // PDF attachments travel as base64

const io = new Server(3005, {
  // DO NOT change the path — the Caddy gateway relies on it
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60_000,
  pingInterval: 25_000,
  maxHttpBufferSize: 32e6,
});

function emitStatus() {
  io.emit("status", { mode: state.mode, status: state.status, phone: state.phone });
}
function emitQr() {
  if (state.qr) io.emit("qr", { qr: state.qr });
}

io.on("connection", (socket) => {
  socket.emit("status", { mode: state.mode, status: state.status, phone: state.phone });
  if (state.qr) socket.emit("qr", { qr: state.qr });
});

/** Notify the Next.js app about service lifecycle (e.g. flush queue). */
async function notifyMain(event, payload = {}) {
  try {
    await fetch(`${MAIN_APP_URL}/api/whatsapp/service-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Token": INTERNAL_TOKEN },
      body: JSON.stringify({ event, ...payload }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn(`[wa-service] notifyMain(${event}) failed:`, err.message);
  }
}

/** Persist an inbound customer message through the main app. */
async function recordInbound(from, text, timestamp) {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/whatsapp/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Token": INTERNAL_TOKEN },
      body: JSON.stringify({ from, text, timestamp }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await res.json().catch(() => null);
    io.emit("message", { direction: "inbound", phone: from, record: j?.record ?? null });
  } catch (err) {
    console.warn("[wa-service] recordInbound failed:", err.message);
  }
}

/* ── REST API ──────────────────────────────────────────────── */

app.get("/status", (_req, res) => {
  res.json({
    mode: state.mode === "initializing" ? "demo" : state.mode,
    status: state.status,
    phone: state.phone,
    qr: state.qr,
    bootedAt: state.bootedAt,
    mainAppUrl: MAIN_APP_URL,
  });
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "whatsapp", port: PORT }));

function requireToken(req, res, next) {
  if (req.get("X-Internal-Token") !== INTERNAL_TOKEN) {
    return res.status(401).json({ ok: false, error: "bad internal token" });
  }
  next();
}

/** POST /send — transport one message (text and/or PDF + caption). */
app.post("/send", requireToken, async (req, res) => {
  const { to, caption, text, pdfBase64, filename } = req.body || {};
  const digits = String(to || "").replace(/\D/g, "");
  if (!digits || digits.length < 10) {
    return res.status(400).json({ ok: false, error: "invalid destination number" });
  }
  const body = (pdfBase64 ? caption || text : text || caption || "").trim();
  if (!pdfBase64 && !body) {
    return res.status(400).json({ ok: false, error: "empty message" });
  }
  if (state.status !== "connected") {
    return res.status(409).json({ ok: false, error: "whatsapp disconnected" });
  }

  const chatId = `${digits}@c.us`;
  try {
    if (state.mode === "demo") {
      await new Promise((r) => setTimeout(r, 350)); // simulate network latency
    } else if (pdfBase64) {
      const { default: waModule } = await import("whatsapp-web.js");
      const { MessageMedia } = waModule ?? {};
      const media = new MessageMedia("application/pdf", pdfBase64, filename || "document.pdf");
      await state.client.sendMessage(chatId, media, { caption: body || undefined });
    } else {
      await state.client.sendMessage(chatId, body);
    }
    io.emit("message", { direction: "outbound", phone: digits });
    console.log(`[wa-service] sent → ${digits}${pdfBase64 ? ` (pdf: ${filename})` : ""}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[wa-service] send failed:", err.message);
    res.status(502).json({ ok: false, error: err.message });
  }
});

/** POST /logout — drop the session (admin "Disconnect"). */
app.post("/logout", requireToken, async (_req, res) => {
  try {
    if (state.mode === "real" && state.client) {
      await state.client.logout().catch(() => {});
      await state.client.destroy().catch(() => {});
    }
    state.status = "disconnected";
    state.phone = null;
    state.qr = null;
    emitStatus();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── Demo controls (used by the QA harness / widget demo) ──── */

/** POST /demo/scan — simulate scanning the QR. */
app.post("/demo/scan", requireToken, async (_req, res) => {
  if (state.mode !== "demo") {
    return res.status(409).json({ ok: false, error: "not in demo mode" });
  }
  state.status = "connected";
  state.phone = "2348088948657"; // the Okomba business number
  state.qr = null;
  emitStatus();
  await notifyMain("ready");
  console.log("[wa-service] demo session connected");
  res.json({ ok: true, status: state.status, phone: state.phone });
});

/** POST /demo/disconnect — simulate a dropped session. */
app.post("/demo/disconnect", requireToken, async (_req, res) => {
  if (state.mode !== "demo") {
    return res.status(409).json({ ok: false, error: "not in demo mode" });
  }
  const wasConnected = state.status === "connected";
  state.status = "disconnected";
  state.phone = null;
  state.qr = await demoQr();
  emitStatus();
  emitQr();
  if (wasConnected) await notifyMain("disconnected");
  res.json({ ok: true });
});

/** POST /demo/inbound — simulate a customer reply. */
app.post("/demo/inbound", requireToken, async (req, res) => {
  if (state.mode !== "demo") {
    return res.status(409).json({ ok: false, error: "not in demo mode" });
  }
  const { from, text } = req.body || {};
  const digits = String(from || "").replace(/\D/g, "");
  if (!digits || !text) return res.status(400).json({ ok: false, error: "from and text required" });
  if (state.status !== "connected") {
    return res.status(409).json({ ok: false, error: "whatsapp disconnected" });
  }
  await recordInbound(digits, String(text), new Date().toISOString());
  res.json({ ok: true });
});

/* ── Demo QR ───────────────────────────────────────────────── */

async function demoQr() {
  return QRCode.toDataURL(
    JSON.stringify({ app: "okomba-analytics", demo: true, ts: Date.now() }),
    { margin: 1, width: 320 }
  );
}

async function startDemo(reason) {
  if (state.mode === "demo") return;
  console.warn(`[wa-service] falling back to DEMO mode (${reason})`);
  state.mode = "demo";
  state.status = "disconnected";
  state.qr = await demoQr();
  emitStatus();
  emitQr();
}

/* ── Real session (whatsapp-web.js) ────────────────────────── */

async function startReal() {
  state.mode = "real";
  state.status = "connecting";
  const { default: waModule } = await import("whatsapp-web.js");
  const { Client, LocalAuth } = waModule ?? {};

  // Session storage: WHATSAPP_DATA_DIR env (Render persistent disk)
  // → /data mount when present → local ./data fallback for dev.
  const dataRoot =
    process.env.WHATSAPP_DATA_DIR ||
    (fs.existsSync("/data") ? "/data" : path.join(__dirname, "data"));
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(dataRoot, "session") }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
    takeoverOnConflict: true,
  });
  state.client = client;

  let gotQr = false;
  const bootTimer = setTimeout(() => {
    if (!gotQr && state.status !== "connected") {
      client.destroy().catch(() => {});
      state.client = null;
      void startDemo(`no QR within ${QR_BOOT_TIMEOUT_MS / 1000}s (Chrome/network unavailable?)`);
    }
  }, QR_BOOT_TIMEOUT_MS);

  client.on("qr", async (qr) => {
    gotQr = true;
    state.status = "connecting";
    state.qr = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
    console.log("[wa-service] QR ready — scan from the admin widget");
    emitStatus();
    emitQr();
  });

  client.on("ready", () => {
    clearTimeout(bootTimer);
    state.status = "connected";
    state.phone = client.info?.wid?.user ?? null;
    state.qr = null;
    console.log(`[wa-service] WhatsApp connected (${state.phone})`);
    emitStatus();
    void notifyMain("ready");
  });

  client.on("authenticated", () => {
    console.log("[wa-service] session authenticated");
  });

  client.on("auth_failure", (msg) => {
    console.error("[wa-service] auth failure:", msg);
  });

  client.on("disconnected", async (reason) => {
    console.warn("[wa-service] disconnected:", reason);
    state.status = "disconnected";
    state.phone = null;
    emitStatus();
    void notifyMain("disconnected", { reason: String(reason) });
    if (reason !== "LOGOUT") {
      // best-effort reconnect (will re-emit a QR if needed)
      setTimeout(() => {
        if (state.client && state.status !== "connected") {
          client.initialize().catch(() => {});
        }
      }, 5000);
    }
  });

  client.on("message", async (msg) => {
    try {
      if (msg.from?.endsWith("@c.us") && msg.body) {
        await recordInbound(msg.from.replace("@c.us", ""), msg.body, new Date().toISOString());
      }
    } catch (err) {
      console.warn("[wa-service] inbound handling failed:", err.message);
    }
  });

  await client.initialize();
}

/* ── Boot ──────────────────────────────────────────────────── */

http.createServer(app).listen(PORT, () => {
  console.log(
    `[wa-service] REST on :${PORT}, socket.io on :${SOCKET_PORT} (mode=${MODE})`
  );
  if (MODE === "demo") {
    void startDemo("WHATSAPP_MODE=demo");
  } else {
    startReal().catch((err) => {
      console.error("[wa-service] real init failed:", err.message);
      void startDemo(`init error: ${err.message}`);
    });
  }
});

/* keep the session dir alive on hosts that prune empty folders */
fs.mkdirSync(path.join(__dirname, "data", "session"), { recursive: true });
