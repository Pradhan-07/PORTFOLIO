export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  badge?: string;
  tag?: string;
  credentialUrl?: string;
  todoNote?: string;
}

export const timelineItems: TimelineItem[] = [
  {
    id: "agriflow-clinic",
    date: "Oct 2026",
    title: "Building AGRIFLOW at VIT-AP",
    description:
      "Engineering Clinics project with my 6-member student team developing an ESP32-based smart irrigation and real-time soil telemetry system.",
    badge: "Active",
    tag: "Engineering Clinics",
  },
  {
    id: "github-streak-record",
    date: "13 Sep – 3 Oct 2026",
    title: "21-Day GitHub Contribution Streak",
    description:
      "58 consecutive contributions with zero breaks across C++ algorithms, web repositories, and hardware firmware. September 2026 total reached 84 contributions.",
    tag: "Milestone",
  },
  {
    id: "leetcode-start",
    date: "Aug 2026",
    title: "Started LeetCode in C++",
    description:
      "Kicked off daily algorithmic problem solving in modern C++, focusing on arrays, two pointers, hashing, and STL efficiency.",
    tag: "DSA Journey",
  },
  {
    id: "hedera-certifications",
    date: "Jun 2026",
    title: "Hedera Certified Foundation (HCF) & Developer Associate (HCDA)",
    description:
      "Earned official dual certifications in distributed ledger technology and smart contracts from the Hashgraph Association.",
    tag: "Certification",
    todoNote: "TODO: Add verification / credential certificate link if available.",
  },
  {
    id: "first-repo",
    date: "Oct 2025",
    title: "First GitHub Repository Pushed",
    description:
      "Took the leap into version control and published my initial codebase, beginning my habit of building and tracking work in public.",
    tag: "Open Source",
  },
  {
    id: "github-created",
    date: "Sep 2025",
    title: "Created GitHub Account (@Pradhan-07)",
    description:
      "Registered on GitHub, stepped into developer tooling, and set up my coding environment.",
    tag: "Origin",
  },
  {
    id: "joined-vit-ap",
    date: "2025",
    title: "Joined VIT-AP University (B.Tech CSE)",
    description:
      "Commenced 4-year undergraduate degree in Computer Science Engineering (Class of 2025–29), focusing on computer science foundations and programming.",
    tag: "Education",
  },
];
