# Karan Kumar Pradhan — Personal Portfolio

A personal developer portfolio built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**, inspired by the monochrome aesthetic of `beebombshell.com`.

Features zero heavy 3D libraries: the interactive ID lanyard runs on pure **2D Verlet integration rope physics** and the background stipple effect runs on **Canvas 2D** with text-aware dimming.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the local development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production (Deploy to Vercel)
```bash
npm run build
```

---

## How to Edit Your Content

### 1. Projects (`data/projects.ts`)
All projects, categories, links, and expanded breakdown notes live here in a single file:
- **Add or edit projects**: Edit the `rawProjects` array in `data/projects.ts`.
- **Categories**: `"Web" | "DSA" | "AI / CV" | "IoT"`. Filter counts and pills update automatically.
- **In-Progress state**: Set `status: "in progress"`. Projects marked in progress automatically float to the top of the grid and display an active status badge.
- **Pending descriptions**: Set `isDescriptionPending: true` to display the sleek "description coming soon" placeholder.
- **TODO Placeholders**: Look for `todoNotes` inside `expanded` to fill in your personal role, sensor telemetry, and repo links when public.

### 2. Stats & Metrics (`data/stats.ts`)
Static counts (Repos, DSA programs, LeetCode solved) are configured here:
- `asOf`: e.g. `"Oct 2026"`
- `repos`: `23`
- `dsaPrograms`: `"69+"`
- `leetcodeSolved`: `29` (with Easy: 12, Medium: 15, Hard: 2)
- `githubUsername`: `"Pradhan-07"` (used for live contribution fetching and profile links)
- `leetcodeUsername`: `"pradhan_07"`

### 3. Experience & Milestones Timeline (`data/timeline.ts`)
The single source of truth for your journey:
- Shared across `/work`, `/about`, and the home page.
- Add or modify milestones, certifications (e.g. Hedera HCF/HCDA), education, and streak records.

### 4. Blog Posts & Writing (`content/posts/`)
Write notes and essays in markdown (`.md` or `.mdx`):
- Create a new file, e.g. `content/posts/my-new-post.md`:
```markdown
---
title: "My New Post Title"
date: "2026-11-01"
readTime: "3 min read"
tags: ["C++", "Systems"]
summary: "A short one-line summary displayed in lists and cards."
---

Your post content in standard markdown...
```

### 5. Quick Takes & Thoughts (`data/quotes.ts`)
Edit the punchy micro-thoughts and developer observations displayed in the masonry section on the index page.

---

## Design System & Motion

- **Strict Monochrome**: Near-black `#0a0a0a` background in dark mode, `#fcfcfc` in light mode. No distracting accent colors.
- **Typography**: Geist Sans for clean grotesk headers, Geist Mono for tags, dates, and metadata labels.
- **Theme Toggle**: Default dark mode with an anti-flash script and instant synchronization.
- **Liquid-Glass Notch Navbar**: Centered floating pill with blur that morphs and compacts on scroll.
- **Verlet Lanyard ID Badge**: Interactive rope physics with distance constraints and mouse/touch dragging. Click to flip card and view GitHub/QR back side.
- **Canvas 2D Stipple Effect**: Dot particles morphing smoothly into "KP" monogram with linear interpolation (LERP).
- **Accessible & Responsive**: Fully responsive down to 360px mobile width, respects `prefers-reduced-motion`, semantic HTML, and skip-to-content links.
- **LLM Summary**: Available at `/llms.txt`.
