export interface TimelineItem {
  id: string;
  isoDate: string; // ISO 8601 date used for programmatic sorting (newest first)
  date: string;
  title: string;
  description: string;
  isNow?: boolean; // Show pulsing dot for current activity
  badge?: string;
  tag?: string;
  credentialUrl?: string;
  todoNote?: string;
}

export const rawTimelineItems: TimelineItem[] = [
  {
    id: "current-3rd-sem-agriflow",
    isoDate: "2026-10-15",
    date: "Now (Oct 2026)",
    title: "3rd Semester B.Tech & Building AGRIFLOW",
    description:
      "Pursuing 3rd semester of my B.Tech in Computer Science Engineering at VIT-AP, while building AGRIFLOW (ESP32 smart irrigation) with my 6-member Engineering Clinics team.",
    isNow: true,
    badge: "Active",
    tag: "Engineering Clinics",
  },
  {
    id: "github-streak-record",
    isoDate: "2026-10-03",
    date: "13 Sep – 3 Oct 2026",
    title: "21-Day GitHub Contribution Streak",
    description:
      "58 consecutive contributions with zero breaks across C++ algorithms, web repositories, and hardware firmware. September 2026 total reached 84 contributions.",
    tag: "Milestone",
  },
  {
    id: "leetcode-start",
    isoDate: "2026-08-01",
    date: "Aug 2026",
    title: "Started LeetCode Journey in C++",
    description:
      "Kicked off daily algorithmic problem solving in modern C++, focusing on arrays, two pointers, hashing, and STL efficiency.",
    tag: "DSA Journey",
  },
  {
    id: "completed-first-year",
    isoDate: "2026-07-01",
    date: "Jul 2026",
    title: "Completed First Year at VIT-AP",
    description:
      "Completed my first year (languages: Java and Python, plus some electronics). Started learning DSA in C++ and exploring web development.",
    tag: "Academics",
  },
  {
    id: "hedera-certifications",
    isoDate: "2026-06-15",
    date: "Jun 2026",
    title: "Hedera Certified Foundation (HCF) & Developer Associate (HCDA)",
    description:
      "Earned official dual certifications in distributed ledger technology and smart contracts from the Hashgraph Association.",
    tag: "Certification",
    todoNote: "TODO: Add verification / credential certificate link if available.",
  },
  {
    id: "first-repo",
    isoDate: "2025-10-10",
    date: "Oct 2025",
    title: "First GitHub Repository Pushed",
    description:
      "Took the leap into version control and published my initial codebase, beginning my habit of building and tracking work in public.",
    tag: "Open Source",
  },
  {
    id: "joined-vit-ap-and-github",
    isoDate: "2025-09-01",
    date: "Sep 2025",
    title: "Joined VIT-AP University & Created GitHub",
    description:
      "Joined VIT-AP University for a B.Tech in Computer Science Engineering (2025 to 2029). Also created my GitHub account (@Pradhan-07).",
    tag: "Education",
  },
];

// Always return timeline sorted strictly by ISO date descending (newest first)
export function getSortedTimeline(): TimelineItem[] {
  return [...rawTimelineItems].sort(
    (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime()
  );
}

export const timelineItems = getSortedTimeline();
