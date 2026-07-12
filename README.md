<div align="center">

# 👓 Lensly

### Prescription Eyewear on Subscription

**€29/month · Fresh lenses every 6 months · 2 free replacements/year**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Documentation](#-documentation)

---

</div>

##  About Lensly

Lensly is a modern direct-to-lab vision care subscription service that revolutionizes how people access prescription eyewear. Instead of paying €1,000+ upfront for glasses that quickly become outdated, Lensly provides an affordable monthly subscription model with continuous care.

### 💡 Why Lensly?

|                           | Traditional Optician      | Lensly Care              |
| ------------------------- | ------------------------- | ------------------------ |
|  **Cost**               | €1,200+ one-time          | €39/month (€468/year)    |
|  **Fresh Lenses**       | Every 2–3 years           | Every 6 months           |
|  **Replacements**      | Full price each time      | 2 free per year          |
|  **Shipping**           | In-store collection       | Free EU delivery         |
|  **Minimum Contract**   | N/A                       | 1 year                   |

###  Features

-  **Regular Updates**: Get new lenses every 6 months to match your current prescription
-  **Damage Protection**: Two free replacements annually for lost, broken, or scratched glasses
-  **EU-Wide Shipping**: Free delivery across the European Union
-  **Flexible Payments**: Monthly subscription via Stripe
-  **Style Variety**: Choose from multiple frame styles and colors
-  **Modern Platform**: Sleek, responsive web application built with cutting-edge technology

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td><strong>Framework</strong></td>
    <td><a href="https://tanstack.com/start">TanStack Start</a> with React 19 & SSR</td>
  </tr>
  <tr>
    <td><strong>Routing</strong></td>
    <td>TanStack Router (file-based routing)</td>
  </tr>
  <tr>
    <td><strong>Styling</strong></td>
    <td>Tailwind CSS v4 with custom design system</td>
  </tr>
  <tr>
    <td><strong>UI Components</strong></td>
    <td>Radix UI primitives + shadcn/ui</td>
  </tr>
  <tr>
    <td><strong>Build Tool</strong></td>
    <td>Vite 7 with optimized production builds</td>
  </tr>
  <tr>
    <td><strong>Runtime</strong></td>
    <td>Bun (fast JavaScript runtime & package manager)</td>
  </tr>
  <tr>
    <td><strong>Payments</strong></td>
    <td>Stripe Checkout with webhook support</td>
  </tr>
  <tr>
    <td><strong>Deployment</strong></td>
    <td>Cloudflare Workers (edge computing)</td>
  </tr>
  <tr>
    <td><strong>Internationalization</strong></td>
    <td>Multi-language support (i18n)</td>
  </tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ or **Bun** 1.2+
- **Git** for version control
- **Stripe Account** for payment processing (production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lensly.git
   cd lensly
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Stripe live keys
   ```
   
   **Important for lensly.care deployment:**
   - Get your Stripe Live Keys from: https://dashboard.stripe.com/apikeys
   - Update `.env` file with your actual keys
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
   
   To verify your environment setup:
   ```bash
   node check-env.js
   ```

4. **Start the development server**
   ```bash
   bun run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
lensly/
├── public/                    # Static assets (images, icons)
│   ├── *.png                  # Frame images and user avatars
│   └── favicon.svg            # Site favicon
│
├── src/
│   ├── assets/                # Dynamic images and media
│   │   ├── client-*.jpg       # Customer testimonial photos
│   │   ├── eye-diagram.jpg    # Educational content
│   │   └── glasses-3d.png     # Product imagery
│   │
│   ├── components/
│   │   └── ui/                # Reusable UI components (50+ components)
│   │       ├── button.tsx     # Button variants and sizes
│   │       ├── card.tsx       # Card layouts
│   │       ├── dialog.tsx     # Modal dialogs
│   │       ├── form.tsx       # Form controls
│   │       └── ...            # And many more
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── use-mobile.tsx     # Mobile detection hook
│   │
│   ├── lib/                   # Core utilities and configurations
│   │   ├── api/               # API integration layer
│   │   │   └── subscriptions.functions.ts
│   │   ├── config.server.ts   # Server-side configuration
│   │   ├── error-capture.ts   # Error tracking utilities
│   │   ├── error-page.ts      # Custom error pages
│   │   ├── error-reporting.ts # Error reporting service
│   │   ├── i18n.tsx           # Internationalization setup
│   │   ├── subscriptions.server.ts # Subscription logic
│   │   └── utils.ts           # Helper functions
│   │
│   ├── routes/                # File-based routing (pages)
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Home page
│   │   ├── admin.tsx          # Admin dashboard
│   │   ├── cancel.tsx         # Subscription cancellation
│   │   ├── success.tsx        # Payment success page
│   │   ├── datenschutz.tsx    # Privacy policy
│   │   ├── impressum.tsx      # Legal imprint
│   │   ├── agb.tsx            # Terms & conditions
│   │   └── widerrufsrecht.tsx # Right of withdrawal
│   │
│   ├── router.tsx             # Router configuration
│   ├── server.ts              # SSR server entry point
│   ├── start.ts               # TanStack Start middleware
│   └── styles.css             # Global styles and Tailwind directives
│
├── .env                       # Environment variables (gitignored)
├── .dockerignore              # Docker ignore patterns
├── .gitignore                 # Git ignore patterns
├── .prettierrc                # Prettier configuration
├── bun.lock                   # Bun lockfile
├── bunfig.toml                # Bun configuration
├── components.json            # shadcn/ui configuration
├── Dockerfile                 # Docker container setup
├── eslint.config.js           # ESLint configuration
├── package.json               # Project dependencies and scripts
└── README.md                  # This file
```

---

## 📜 Available Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `bun run dev`        | Start development server with hot module reload  |
| `bun run build`      | Create optimized production build                |
| `bun run preview`    | Preview production build locally                 |
| `bun run lint`       | Run ESLint to check code quality                 |
| `bun run format`     | Format code with Prettier                        |

---

## 🌐 Deployment

### Cloudflare Workers (Recommended)

Lensly is optimized for deployment on **Cloudflare Workers** for edge performance:

```bash
# Build for production
bun run build

# Deploy to Cloudflare Workers
# Follow Cloudflare Workers deployment guide
```

### Alternative Platforms

To deploy on other platforms, update the `server` preset in `vite.config.ts`:

- **Vercel**: Change preset to `"vercel"`
- **Netlify**: Change preset to `"netlify"`
- **Node.js**: Change preset to `"node-server"`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

### Server-Side Variables (Secret)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (if applicable)
DATABASE_URL=postgresql://...

# Email Service (if applicable)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@lensly.com
SMTP_PASS=...
```

### Client-Side Variables (Public)
```env
# Must use VITE_ prefix to be accessible in browser
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_API_URL=https://api.lensly.com
```

⚠️ **Important**: Never commit `.env` files to version control!

---

## 🎨 Customization

### Styling

- **Tailwind Config**: Customize colors, fonts, and breakpoints in `tailwind.config.js`
- **Global Styles**: Edit `src/styles.css` for global CSS and theme tokens
- **Component Variants**: Modify `src/components/ui/*` for UI component styles

### Adding New Pages

Thanks to file-based routing, simply create a new file in `src/routes/`:

```tsx
// src/routes/about.tsx
export default function AboutPage() {
  return <div>About Lensly</div>
}
```

The page will be automatically available at `/about`.

---

## 🧪 Testing

```bash
# Run tests (if configured)
bun test

# Run tests in watch mode
bun test --watch
```

---

## 👥 Contributors

Thanks to these amazing people who have contributed to Lensly:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/shaonsikder1952">
        <img src="https://github.com/shaonsikder1952.png" width="80px;" alt="Shaon Sikder"/>
        <br />
        <sub><b>Shaon Sikder</b></sub>
      </a>
      <br />
      <sub>Project Owner</sub>
    </td>
    <td align="center">
      <a href="https://github.com/aroyslipk">
        <img src="https://github.com/aroyslipk.png" width="80px;" alt="Anik Roy"/>
        <br />
        <sub><b>Anik Roy</b></sub>
      </a>
      <br />
      <sub>Developer</sub>
    </td>
  </tr>
</table>

---

## 🤝 Contributing

This is a private project. If you have access and want to contribute:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📝 License

**Private & Proprietary**

All rights reserved © 2026 Lensly. This software and associated documentation files are the proprietary property of Lensly and may not be used, copied, modified, or distributed without explicit permission.

---

## 📧 Contact

For questions or support, please contact:

- **Website**: [https://lensly.com](https://lensly.com)
- **Email**: support@lensly.com

---

<div align="center">

**Made with ❤️ by the Lensly Team**

⭐ Star this repo if you find it useful!

</div>
