# Lensly

**Prescription eyewear on a subscription. €39/month.**

New lenses every 6 months. Two free replacements a year (lost, broken, or scratched). Free EU shipping. Cancel anytime.

---

## What is Lensly?

Lensly is a direct-to-lab vision care subscription. Instead of paying €1,000+ upfront for a single pair of glasses that goes out of date, you pay €39/month and always have a current prescription.

| | Traditional optician | Lensly Care |
|---|---|---|
| Cost | €1,200+ one-time | €39/month (€468/year) |
| Fresh lenses | Every 2–3 years | Every 6 months |
| Replacements | Full price | 2 free per year |
| Shipping | In-store collection | Free EU delivery |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI + shadcn/ui |
| Build tool | Vite 7 |
| Package manager | Bun |
| Payments | Stripe Checkout |

---

## Getting Started

**Requirements:** Node 20+ or Bun 1.2+

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
src/
├── assets/          # Images (glasses, client photos)
├── components/ui/   # Radix-based UI components
├── hooks/           # Custom React hooks
├── lib/             # Utilities, error handling, server config
├── routes/          # File-based pages (__root.tsx, index.tsx)
├── styles.css       # Global styles + Tailwind theme tokens
├── router.tsx       # Router factory
├── server.ts        # SSR entry point (Nitro/Cloudflare)
└── start.ts         # TanStack Start middleware
```

---

## Available Scripts

```bash
bun run dev        # Start dev server with HMR
bun run build      # Production build
bun run preview    # Preview production build locally
bun run lint       # ESLint
bun run format     # Prettier
```

---

## Deployment

The app is built for **Cloudflare Workers** (default Nitro target via TanStack Start). To deploy:

```bash
bun run build
# Deploy dist/ to your Cloudflare Workers project
```

For other platforms (Vercel, Node, etc.) update the `server` preset in `vite.config.ts`.

---

## Environment Variables

Server-only variables go in `.env` (never prefixed with `VITE_`):

```env
# Example
STRIPE_SECRET_KEY=sk_live_...
```

Client-side variables must use the `VITE_` prefix and are public.

---

## License

Private — all rights reserved © 2026 Lensly.
