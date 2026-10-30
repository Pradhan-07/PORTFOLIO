import { stats } from "@/data/stats";
import { projects } from "@/data/projects";
import { timelineItems } from "@/data/timeline";

export async function GET() {
  const content = `# Karan Kumar Pradhan — Portfolio & Context

## Summary
Karan Kumar Pradhan is a 2nd-year undergraduate BTech Computer Science & Engineering student at VIT-AP University (Class of 2025–2029). He focuses on Data Structures and Algorithms in C++, modern full-stack web engineering with TypeScript and Next.js, and IoT/embedded systems with ESP32.

## Key Profiles & Links
- Resume (Web & PDF): https://karan-pradhan.vercel.app/resume
- Direct PDF Download: https://karan-pradhan.vercel.app/Karan-Kumar-Pradhan-Resume.pdf
- GitHub: https://github.com/Pradhan-07
- LinkedIn: https://www.linkedin.com/in/karan-kumar-pradhan-510062396/
- LeetCode: https://leetcode.com/u/pradhan_07/
- X (Twitter): https://x.com/pradhankar65796
- Instagram: https://www.instagram.com/pradhan___07
- Email: pradhankaran058@gmail.com

## Current Verified Stats (as of ${stats.asOf})
- Academics (CGPA): ${stats.cgpa} / ${stats.cgpaScale} (B.Tech CSE at VIT-AP University, 3rd semester)
- Public GitHub Repositories: ${stats.repos}
- C++ DSA Programs: ${stats.dsaPrograms}
- LeetCode Solved: ${stats.leetcodeSolved} (Easy: ${stats.leetcodeBreakdown.easy}, Medium: ${stats.leetcodeBreakdown.medium}, Hard: ${stats.leetcodeBreakdown.hard})
- Longest Recorded GitHub Streak: ${stats.streakFallbackDays} days (58 contributions without breaks; 84 contributions in Sept 2026)

## Featured Projects
${projects
  .map(
    (p, i) => `### ${i + 1}. ${p.title} (${p.year})
- Category: ${p.category}
- Status: ${p.status || "completed"}
- Tags: ${p.tags.join(", ")}
- Description: ${p.shortDescription}
- Code: ${p.codeUrl || "In progress / internal"}
- Live: ${p.liveUrl || "N/A"}`
  )
  .join("\n\n")}

## Experience & Milestones
${timelineItems
  .map((t) => `- [${t.date}] ${t.title}: ${t.description}`)
  .join("\n")}

## Core Skills
- Languages: C++, Python, TypeScript, JavaScript, HTML, CSS, C
- Frameworks & Libraries: React, Next.js (App Router), Tailwind CSS, Framer Motion, Vite, Flask
- Tools & Platforms: Git, GitHub, VS Code, Vercel, Supabase, Leaflet, OpenCV, YOLOv8, MediaPipe
- Hardware: ESP32, Arduino microcontrollers, IoT soil sensors

## Status
Open to summer software engineering internships, open-source collaborations, and systems development roles.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
