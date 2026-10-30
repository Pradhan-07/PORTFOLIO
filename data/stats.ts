export interface StatsData {
  repos: number;
  dsaPrograms: string;
  dsaProgramsCount: number;
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
