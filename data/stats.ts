// SINGLE SOURCE OF TRUTH FOR ALL NUMERICAL STATS ACROSS THE PORTFOLIO
// Used by Home tiles, teaser paragraphs, Resume page, and metadata.
export interface StatsData {
  repos: number;
  dsaPrograms: string;
  dsaProgramsCount: number;
  // TODO: Karan, please verify your exact LeetCode solved count below (currently set to 39: 20 Easy, 17 Medium, 2 Hard based on pradhan_07 live telemetry). CGPA is confirmed at 8.10.
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
  // TODO: Fill or confirm your LeetCode solved count (live sync pulls dynamically when active):
  leetcodeSolved: 39,
  leetcodeBreakdown: {
    easy: 20,
    medium: 17,
    hard: 2,
  },
  streakFallbackDays: 21, // 21-day streak record (13 Sep – 3 Oct 2026)
  totalContributionsFallback: 213,
  asOf: "Oct 2026",
  githubUsername: "Pradhan-07",
  leetcodeUsername: "pradhan_07",
  studentId: "25BCE7526",
  email: "pradhankaran058@gmail.com",
  cgpa: "8.10",
  cgpaScale: "10",
};
