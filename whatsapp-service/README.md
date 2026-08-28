# WhatsApp mini-service (Module 6)

WhatsApp transport for Okomba Analytics — owns the WhatsApp Web session
(whatsapp-web.js + puppeteer) and the live admin socket channel. It never
touches the app database; all persistence happens in the Next.js app via
internal HTTP (`X-Internal-Token`).

## Run

```bash
cd mini-services/whatsapp-service
bun install
bun run dev        # node --watch index.js
```

Ports (fixed):
- **3004** — REST API, called server-to-server by the Next.js app
- **3005** — socket.io for the browser, path `/`, reached through the
  gateway as `io("/?XTransformPort=3005")`

> socket.io must sit at path `/` for the Caddy gateway, and engine.io at
> `/` intercepts every request — that is why REST and socket.io cannot
> share a listener.

## Modes (`WHATSAPP_MODE` env)

| Mode | Behavior |
|---|---|
| `auto` (default) | Try the real engine; fall back to demo if Chrome/QR fails within 45s |
| `real` | whatsapp-web.js only — a real QR appears in the admin widget to scan |
| `demo` | Simulated session: scan/connected/sends/replies for QA without a phone |

Session persists in `data/session/` (LocalAuth) — scan once, survive restarts.

## REST API (:3004, `X-Internal-Token` header)

| Endpoint | Purpose |
|---|---|
| `GET /status` | mode, status, phone, current QR (data-URL) |
| `POST /send` | `{ to, caption?, text?, pdfBase64?, filename? }` — transport one message |
| `POST /logout` | Drop the session |
| `POST /demo/scan` | (demo) simulate scanning the QR |
| `POST /demo/disconnect` | (demo) simulate a dropped session |
| `POST /demo/inbound` | (demo) simulate a customer reply |

## Socket events (:3005)

`status` { mode, status, phone } · `qr` { qr } · `message` { direction, phone }

## Lifecycle hooks → Next.js app

- On `ready`: `POST /api/whatsapp/service-event` → the app flushes queued
  outbound `whatsapp_messages` (proposal captions / reminders that piled up
  while disconnected), regenerating each invoice PDF.
- On inbound message: `POST /api/whatsapp/inbound` → row in
  `whatsapp_messages` → appears in the admin widget instantly.
