export type ProjectCategory = "Web" | "DSA" | "AI / CV" | "IoT";

export interface Project {
  id: string;
  number: string;
  title: string;
  year: string;
  status?: "in progress" | "completed";
  category: ProjectCategory;
  shortDescription: string;
  isDescriptionPending?: boolean; // For flowerglow & magic_hand
  tags: string[];
  codeUrl?: string; // empty string or undefined if TODO
  liveUrl?: string;
  profileUrl?: string;
  expanded?: {
    overview?: string;
    highlights?: string[];
    role?: string;
    teamSize?: number;
    statusDetails?: string;
    todoNotes?: string;
  };
}

export const rawProjects: Project[] = [
  {
    id: "agriflow",
    number: "01",
    title: "AGRIFLOW",
    year: "2026",
    status: "in progress",
    category: "IoT",
    shortDescription:
      "ESP32-based smart irrigation and soil-monitoring system, built with my 6-member Engineering Clinics team at VIT-AP.",
    tags: ["ESP32", "IoT", "Arduino", "C++"], // TODO: confirm sensors/stack
    codeUrl: "", // TODO: add repo if public
    liveUrl: "",
    expanded: {
      role: "Firmware logic & sensor telemetry integration (TODO: flesh out exact role responsibilities)",
      teamSize: 6,
      overview:
        "Engineered as part of Engineering Clinics at VIT-AP University. Integrates soil moisture, temperature, and environmental telemetry with ESP32 microcontrollers to optimize irrigation cycles automatically.",
      highlights: [
        "Real-time soil moisture and ambient temperature telemetry via ESP32",
        "Automated solenoid valve trigger logic based on dynamic thresholds",
        "Low-power sensor polling intervals for efficient field operation",
      ],
      statusDetails: "Active prototype testing and field sensor calibration.",
      // Visible placeholder for Karan to fill in
      todoNotes: "TODO: Write detailed personal role breakdown, exact sensor modules list, and repo link once made public.",
    },
  },
  {
    id: "this-portfolio",
    number: "02",
    title: "This Portfolio (Next.js)",
    year: "2026",
    status: "completed",
    category: "Web",
    shortDescription:
      "Personal site with Verlet physics lanyard badge, Canvas 2D stipple particles, live GitHub streak and a strict monochrome dark/light design system.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Canvas 2D", "Framer Motion"],
    codeUrl: "https://github.com/Pradhan-07/PORT",
    liveUrl: "https://karan-pradhan.vercel.app",
    expanded: {
      overview:
        "Designed with a brutalist yet polished monochrome aesthetic inspired by beebombshell.com. Features zero heavy 3D libraries: the lanyard rope physics runs on 2D Verlet integration, and the particle field runs on optimized Canvas 2D.",
      highlights: [
        "Verlet integration rope simulation with interactive drag, gravity, and 3D-card flip effect",
        "Morphing Canvas 2D stipple particles forming 'KP' monogram with text-aware dimming",
        "Live GitHub streak and contributions heatmap integration",
        "Fluid dark and light mode with zero accent color and crisp 1px borders",
      ],
    },
  },
  {
    id: "study-detection",
    number: "03",
    title: "study_detection",
    year: "2026",
    status: "completed",
    category: "AI / CV",
    shortDescription:
      "Computer-vision study monitor that uses OpenCV face-mesh and YOLO to detect sleeping, face covering and phone use, with audio alerts.",
    tags: ["Python", "OpenCV", "YOLOv8", "MediaPipe"],
    codeUrl: "https://github.com/Pradhan-07/study_detection",
    expanded: {
      overview:
        "An automated computer-vision vigilance monitor built to combat study distractions. Analyzes webcam video streams in real-time to track head posture, eyelid closure duration, and prohibited objects like smartphones.",
      highlights: [
        "OpenCV & MediaPipe facial landmark mesh for micro-nod and sleep detection",
        "YOLOv8 object detection trained to flag smartphone usage in frame",
        "Audio beep triggers on sustained distraction thresholds with zero cloud latency",
      ],
    },
  },
  {
    id: "indstate",
    number: "04",
    title: "indstate",
    year: "2026",
    status: "completed",
    category: "Web",
    shortDescription:
      "Property marketplace with live listings, filters and map view.",
    tags: ["React", "Supabase", "Leaflet"],
    codeUrl: "https://github.com/Pradhan-07/indstate",
    expanded: {
      overview:
        "Full-featured real estate exploration web application featuring interactive spatial map discovery and database-backed property filtering.",
      highlights: [
        "Interactive Leaflet geospatial mapping with custom coordinate pins",
        "Supabase PostgreSQL backend with authentication and relational listing storage",
        "Instant parametric filtering by price range, locality, and property dimensions",
      ],
    },
  },
  {
    id: "resolutions-tracker",
    number: "05",
    title: "Resolutions Tracker",
    year: "2026",
    status: "completed",
    category: "Web",
    shortDescription:
      "Gamified goal tracker with daily check-ins, streaks, XP and levels.",
    tags: ["Flask", "SQLite", "Python"],
    codeUrl: "https://github.com/Pradhan-07/Resolutions_Tracker",
    expanded: {
      overview:
        "A lightweight Python web app turning yearly habit formation into an RPG-style progression loop. Tracks consistent execution through streaks, experience points, and level-ups.",
      highlights: [
        "Daily check-in verification algorithms calculating consecutive streak multipliers",
        "Dynamic XP leveling formulas rewarding long-term consistency",
        "Normalized SQLite schema with clean relational data models",
      ],
    },
  },
  {
    id: "dsa-cpp",
    number: "06",
    title: "C++ DSA Library (DSA_CPP)",
    year: "2026",
    status: "completed",
    category: "DSA",
    shortDescription:
      "Topic-wise C++ data structures and algorithms library: arrays, sorting, recursion, OOP, linked lists. 69+ programs.",
    tags: ["C++", "DSA"],
    codeUrl: "https://github.com/Pradhan-07/DSA_CPP",
    expanded: {
      overview:
        "A comprehensive, structured repository of core computer science foundational concepts implemented from scratch in modern C++. Contains 69+ programs with clean documentation and edge-case handling.",
      highlights: [
        "Arrays, Sorting (QuickSort, MergeSort), Searching, Recursion & Backtracking",
        "Object-Oriented Programming (OOP) architectures in C++",
        "Singly & Doubly Linked List implementations with pointer manipulation",
      ],
      statusDetails: "Currently moving on to Trees, Graphs, and Dynamic Programming.",
    },
  },
  {
    id: "leetcode-solutions",
    number: "07",
    title: "LeetCode Solutions in C++",
    year: "2026",
    status: "completed",
    category: "DSA",
    shortDescription:
      "My LeetCode solutions in C++, organised by problem and topic. 29 solved so far (Easy 12, Medium 15, Hard 2).",
    tags: ["C++", "DSA", "Competitive Programming"],
    codeUrl: "https://github.com/Pradhan-07/leetcode_question_answer",
    profileUrl: "https://leetcode.com/u/pradhan_07/",
    expanded: {
      overview:
        "Organized repository tracking algorithmic problem-solving progress on LeetCode. Each solution includes complexity analysis (Time & Space) and commentary on trade-offs.",
      highlights: [
        "Categorized by data structure: Arrays, Hash Maps, Two Pointers, Sliding Window, Stacks",
        "Optimal memory usage and standard template library (STL) idioms",
        "Profile link available with verified submissions",
      ],
      statusDetails: "Active daily problem practice.",
    },
  },
  {
    id: "first-portfolio",
    number: "08",
    title: "First portfolio (React + Vite)",
    year: "2026",
    status: "completed",
    category: "Web",
    shortDescription:
      "My earlier personal portfolio built with React, TypeScript and Vite.",
    tags: ["React", "TypeScript", "Vite"],
    codeUrl: "https://github.com/Pradhan-07/PORTFOLIO",
    liveUrl: "https://karan07dev.vercel.app/",
    expanded: {
      overview:
        "The initial iteration of my personal website, created to showcase early experiments, learn the React component model, and explore responsive layout design with Vite.",
      highlights: [
        "Lightweight single page architecture powered by Vite",
        "Component-based UI with TypeScript type safety",
        "Continuous deployment configured with Vercel",
      ],
    },
  },
  {
    id: "flowerglow",
    number: "09",
    title: "flowerglow",
    year: "2026",
    status: "in progress",
    category: "Web",
    shortDescription: "Interactive web experience repository.",
    isDescriptionPending: true,
    tags: ["JavaScript", "HTML5", "CSS"],
    codeUrl: "https://github.com/Pradhan-07/flowerglow",
    expanded: {
      // Visible TODO placeholder
      todoNotes: "TODO: Write detailed description for flowerglow (JavaScript repository, 1 star).",
    },
  },
  {
    id: "magic-hand",
    number: "10",
    title: "magic_hand",
    year: "2026",
    status: "in progress",
    category: "AI / CV",
    shortDescription: "Hand-tracking & gesture interaction experiment in Python.",
    isDescriptionPending: true,
    tags: ["Python", "Computer Vision"],
    codeUrl: "https://github.com/Pradhan-07/magic_hand",
    expanded: {
      // Visible TODO placeholder
      todoNotes: "TODO: Write detailed description for magic_hand (Python repository).",
    },
  },
];

// Helper to return sorted projects: "In progress" first, then by year descending
export function getSortedProjects(): Project[] {
  return [...rawProjects].sort((a, b) => {
    const aInProgress = a.status === "in progress" ? 1 : 0;
    const bInProgress = b.status === "in progress" ? 1 : 0;
    if (aInProgress !== bInProgress) {
      return bInProgress - aInProgress; // in progress comes first
    }
    return Number(b.year) - Number(a.year);
  });
}

export const projects = getSortedProjects();

// Categories computed directly from data
export const ALL_CATEGORIES = ["All", "Web", "DSA", "AI / CV", "IoT"] as const;
export type FilterCategory = (typeof ALL_CATEGORIES)[number];

export function getCategoryCounts(items: Project[] = rawProjects): Record<FilterCategory, number> {
  const counts: Record<FilterCategory, number> = {
    All: items.length,
    Web: 0,
    DSA: 0,
    "AI / CV": 0,
    IoT: 0,
  };

  for (const item of items) {
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  }

  return counts;
}

