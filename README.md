# Okomba Analytics

Premium digital services ecosystem — web development, fintech solutions, digital operations, and more.

## Stack

- **Framework:** React 18
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS 3 + CSS custom properties (inline)
- **Deployment:** Cloudflare Pages

## Getting Started

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your admin credentials

# Start dev server
npm run dev

# Production build
npm run build
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Purpose |
|---|---|
| `VITE_ADMIN_EMAIL` | Email to log into the admin dashboard |
| `VITE_ADMIN_PASSWORD` | Password to log into the admin dashboard |

Set these in the **Cloudflare Pages dashboard** under Settings → Environment Variables.

> ⚠️ These values are embedded in the client-side bundle. Use credentials dedicated to this dashboard only, and consider protecting the `/admin` route with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/).

## Cloudflare Pages Deployment

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables from `.env.example`
5. Deploy

SPA routing is handled by `public/_redirects`.
Security headers are set in `public/_headers`.

## Admin Dashboard

Navigate to `/#/admin` to access the admin portal.
The dashboard shows inquiry statistics and submitted service requests (stored in browser `localStorage`).
