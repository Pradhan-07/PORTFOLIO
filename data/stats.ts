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
  asOf: string;
  githubUsername: string;
  leetcodeUsername: string;
}

export const stats: StatsData = {
  repos: 23,
  dsaPrograms: "69+",
  dsaProgramsCount: 69,
  leetcodeSolved: 29,
  leetcodeBreakdown: {
    easy: 12,
    medium: 15,
    hard: 2,
  },
  streakFallbackDays: 21, // 21-day streak record (13 Sep – 3 Oct 2026)
  asOf: "Oct 2026",
  githubUsername: "Pradhan-07",
  leetcodeUsername: "pradhan_07",
};
