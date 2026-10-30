# Karan Kumar Pradhan — Personal Portfolio

A personal developer portfolio built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**, inspired by the design language of `beebombshell.com`.

Features an interactive landscape ID badge on the hero powered by **2D Verlet integration rope physics** hanging from the notch tab navbar with 3D flip, live GitHub streak heatmap, and strict monochrome / warm cream theming.

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
All projects, categories, links, and expanded breakdown notes live in a single file:
- **Add or edit projects**: Edit the `rawProjects` array in `data/projects.ts`.
- **Categories**: `"Web" | "DSA" | "AI / CV" | "IoT"`. Filter counts and pills update automatically.
- **In-Progress state**: Set `status: "in progress"`. Projects marked in progress automatically float to the top of the grid and display an active status badge.
- **Pending descriptions**: Set `isDescriptionPending: true` to display the sleek "description coming soon" placeholder.
- **TODO Placeholders**: Look for `todoNotes` inside `expanded` to fill in your personal role, sensor telemetry, and repo links when public.

### 2. Stats & Metrics (`data/stats.ts`)
Static counts (Repos, CGPA, DSA programs, LeetCode solved) are configured here:
- `asOf`: `"Oct 2026"`
- `cgpa`: `"8.10"` (scale `"10"`)
- `repos`: `23`
- `dsaPrograms`: `"69+"`
- `leetcodeSolved`: `29` (with Easy: 12, Medium: 15, Hard: 2)
- `githubUsername`: `"Pradhan-07"` (used for live contribution fetching and profile links)
- `leetcodeUsername`: `"pradhan_07"`

### 3. Experience & Milestones Timeline (`data/timeline.ts`)
The single source of truth for your journey:
- Programmatically sorted by `isoDate` descending.
- Shared across `/work`, `/about`, and `/resume`.
- Add or modify milestones, certifications (e.g. Hedera HCF/HCDA), education, and streak records.

### 4. Resume (`data/resume.ts`)
Centralizes your resume data, coursework, skills, and links to `/Karan-Kumar-Pradhan-Resume.pdf`.

---

## Design System & Motion

- **Strict Monochrome**: Near-black `#0a0a0a` background in dark mode, warm cream `#f4f2ec` in light mode.
- **Typography**: Geist Sans for headings, Geist Mono for tags, dates, and metadata labels.
- **Theme Toggle**: Default dark mode with an anti-flash script and instant synchronization.
- **Liquid-Glass Notch Tab Navbar**: Centered tab navbar sticking to the top edge that anchors the lanyard.
- **Verlet Lanyard ID Badge**: Interactive rope physics with distance constraints and mouse/touch dragging. Click to flip card in 3D perspective and view GitHub/LED matrix back side.
- **Accessible & Responsive**: Fully responsive down to 360px mobile width, respects `prefers-reduced-motion`, semantic HTML, and skip-to-content links.
- **LLM Summary**: Available at `/llms.txt`.
