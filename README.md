# Karan Kumar Pradhan — Personal Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Playwright-10%2F10_Passed-2EAD33?logo=playwright)](https://playwright.dev/)
[![Live Domain](https://img.shields.io/badge/Live-pradhan.runs--on.dev-0a0a0a)](https://pradhan.runs-on.dev)

A personal portfolio engineered with **Next.js (App Router + Turbopack)**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**. Designed with a brutalist yet polished monochrome aesthetic, responsive physics simulations, real-time developer telemetry, and a calm ambient background system.

---

## 🌐 Live Deployments

- **Primary Custom Domain**: [https://pradhan.runs-on.dev](https://pradhan.runs-on.dev)
- **Vercel Mirror**: [https://karan07dev.vercel.app](https://karan07dev.vercel.app)
- **GitHub Repository**: [https://github.com/Pradhan-07/PORTFOLIO](https://github.com/Pradhan-07/PORTFOLIO)
- **LLM Dossier**: [https://pradhan.runs-on.dev/llms.txt](https://pradhan.runs-on.dev/llms.txt)

---

## ✨ Key Features

### 1. Interactive Verlet Lanyard ID Badge
- **Verlet Rope Physics**: 2D rope simulation with real-time distance constraints, gravity, and drag-and-settle mechanics.
- **Single-Ribbon Woven Strap**: Brushed-silver anchor bar under the notch navbar, Catmull-Rom spline normal offsets, fine diagonal weave texture, edge stitching, and crisp single-layer mono typography (`KARAN KUMAR PRADHAN · VIT-AP · B.TECH CSE ·`).
- **Front Face**: High-resolution profile portrait with spring-smoothed 3D tilt, glass-sweep sheen, university badges, and live LeetCode stats.
- **3D Card Flip**: Click or flip to reveal the reverse side featuring a live GitHub streak heatmap, commit activity, and contact coordinates.

### 2. Restrained Ambient Background System
Designed for zero visual clutter and maximum performance (zero per-frame JS background loops; purely CSS keyframes and scroll-linked transforms):
- **Global Base Background**: 24px pitch dot-grid (4.5% opacity) with radial vignette mask and film grain.
- **Hero Breathing Glow**: 14s alternate ease-in-out breathing radial glow (`animate-hero-glow`).
- **Resume Teaser Grid**: 64px hairline grid with radial mask fading away from stat tiles.
- **Let's Talk Mesh & Spotlight**: 3 static blurred pastel blobs with 0.15x scroll parallax plus a 300px hover spotlight.
- **/work Topographic Contours**: 1px SVG contour rings at ~5% opacity with top/bottom gradient masks.
- **/resume Progress Rail**: 2px left margin rail with spring fill gradient and interactive section markers.
- **/about Diagonal Light Beam**: Soft diagonal ambient gradient beam swaying slowly (±2° over 20s).

### 3. Giant "PRADHAN" Ember-Lines Footer
- Monogram rasterization with horizontal slice lines and upward drifting ember particles.
- Automatic viewport entry burst via `IntersectionObserver`.
- Scoped hover heat diffusion with decay easing.

### 4. Real-Time Developer Telemetry
- **Live GitHub Sync**: Automatic server-side fetching of contribution heatmaps, total commits, and streak counts.
- **Live LeetCode Sync**: Real-time integration pulling solved problems (Easy, Medium, Hard).
- **Fallback Resilience**: Baseline verified stats preventing layout shifts on cold starts.

---

## 🚀 Performance & Quality Metrics

| Metric | Target | Verified Value | Status |
| :--- | :--- | :--- | :--- |
| **Next.js Dev Overlay** | 0 Issues | **0 Issues** | Passed |
| **Console Errors / Warnings** | 0 | **0 Errors / 0 Warnings** | Passed |
| **Frame Rate (FPS)** | $\ge 54\text{ FPS}$ | **60–61.8 FPS** steady | Passed |
| **Cumulative Layout Shift (CLS)** | $\le 0.05$ | **0.00** | Passed |
| **Playwright Audit Suite** | All pass | **10 / 10 passed** | Passed |
| **Production Build (`next build`)** | Clean | **454ms compile**, 1.3 MB static | Passed |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion 14](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Physics**: Custom 2D Verlet integration (`lib/verlet.ts`)
- **Testing**: [Playwright](https://playwright.dev/) (Multi-viewport, multi-DPR, physics, and telemetry verification)

---

## 📁 Project Structure

```text
├── app/
│   ├── layout.tsx            # Global metadata, viewport, font definitions, and base background
│   ├── page.tsx              # Home route (Hero, Lanyard Badge, Stats, Resume Teaser, Contact)
│   ├── work/                 # /work project archive with category filter pills
│   ├── resume/               # /resume interactive web resume with progress rail & print view
│   ├── about/                # /about dossier with timeline and ambient beam
│   ├── api/                  # Serverless routes for GitHub and LeetCode live sync
│   └── globals.css           # Design tokens, keyframe animations, and theme variables
├── components/
│   ├── hero/
│   │   ├── Badge.tsx         # ID Card front/back 3D perspective and layout
│   │   └── Lanyard.tsx       # Verlet rope canvas, ribbon strap, and Catmull-Rom spline
│   ├── backgrounds/          # Restrained background components (Dots, Grid, Contours, Mesh, Rail)
│   ├── CustomCursor.tsx      # Smooth single-dot custom cursor
│   ├── FooterEmberLines.tsx  # "PRADHAN" animated typography banner
│   └── Navbar.tsx            # Notch tab navbar with instant theme toggle
├── data/
│   ├── projects.ts           # Project catalog, tags, descriptions, and repo links
│   ├── resume.ts             # Coursework, certifications, and experience data
│   ├── stats.ts              # Verified fallback metrics for LeetCode, CGPA, and repos
│   └── site.ts               # Social profiles, metadata, and contact configuration
├── public/
│   ├── karan-color.png       # High-res profile portrait
│   ├── karan-bw.png          # Monochrome profile variant
│   └── Karan-Kumar-Pradhan-Resume.pdf # Printable 1-page PDF
└── tests/
    ├── badge-physics.spec.ts # Physics constraint & stretch regression tests
    ├── comprehensive-audit.spec.ts # Multi-viewport, multi-zoom, 60 FPS, and CLS audit
    └── user-experience-audit.spec.ts # Interaction and responsiveness tests
```

---

## 💻 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed.

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run tests
```bash
npx playwright test
```

### 5. Build for production
```bash
npm run build
```

---

## 🚢 Deployment

### Deploying to Vercel
1. Import this repository in the [Vercel Dashboard](https://vercel.com/new).
2. Framework Preset: **Next.js**.
3. Deploy!

### Connecting `pradhan.runs-on.dev`
1. In your Vercel Project Settings, navigate to **Domains** and add `pradhan.runs-on.dev`.
2. In the [runs-on.dev management portal](https://runs-on.dev/manage), add a `CNAME` pointing to `cname.vercel-dns.com`.

---

## 👤 Author

**Karan Kumar Pradhan**
- B.Tech Computer Science & Engineering (2025–2029) · VIT-AP University
- Portfolio: [https://pradhan.runs-on.dev](https://pradhan.runs-on.dev)
- GitHub: [@Pradhan-07](https://github.com/Pradhan-07)
- LinkedIn: [karan-kumar-pradhan](https://www.linkedin.com/in/karan-kumar-pradhan-510062396/)
- Email: [pradhankaran058@gmail.com](mailto:pradhankaran058@gmail.com)

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
