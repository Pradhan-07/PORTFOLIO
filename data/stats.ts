// SINGLE SOURCE OF TRUTH FOR ALL NUMERICAL STATS ACROSS THE PORTFOLIO
// Used by Home tiles, teaser paragraphs, Resume page, and metadata.
export interface StatsData {
  repos: number;
  dsaPrograms: string;
  dsaProgramsCount: number;
  // TODO: Karan, please verify your exact LeetCode solved count below (currently set to 41: 22 Easy, 17 Medium, 2 Hard based on pradhan_07 live telemetry). CGPA is confirmed at 8.10.
  leetcodeSolved: number;
  leetcodeBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  streakFallbackDays: number;
  totalContributionsFallback: number;
  asOf: string;
  githubUsername: string;
  leetcodeUsername: string;
  studentId: string;
  email: string;
  cgpa: string;
  cgpaScale: string;
}

export const stats: StatsData = {
  repos: 23,
  dsaPrograms: "69+",
  dsaProgramsCount: 69,
  // TODO: Karan, please confirm your exact LeetCode solved count (live sync pulls dynamically when active):
  leetcodeSolved: 41,
  leetcodeBreakdown: {
    easy: 22,
    medium: 17,
    hard: 2,
  },
  streakFallbackDays: 21, // 21-day streak record (13 Sep – 3 Oct 2026)
  totalContributionsFallback: 213,
  asOf: "Nov 2026",
  githubUsername: "Pradhan-07",
  leetcodeUsername: "pradhan_07",
  studentId: "",
  email: "pradhankaran058@gmail.com",
  cgpa: "8.10",
  cgpaScale: "10",
};
