"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { stats } from "@/data/stats";

export interface GitHubDay {
  date: string;
  count: number;
  level: number;
}

export interface GitHubWeek {
  days: GitHubDay[];
}

export interface LiveGitHubData {
  username: string;
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  weeks: GitHubWeek[];
  lastUpdated?: string;
  isFallback: boolean;
}

export interface LeetCodeSubmission {
  title: string;
  status: string;
  lang: string;
  timestamp: string;
}

export interface LiveLeetCodeData {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  recentSubmissions: LeetCodeSubmission[];
  lastUpdated?: string;
  isFallback: boolean;
}

interface LiveStatsContextType {
  github: LiveGitHubData;
  leetcode: LiveLeetCodeData;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  refresh: () => Promise<void>;
}

// Baseline fallbacks that match Karan's verified stats to guarantee ZERO layout shifts on SSR
const defaultGitHub: LiveGitHubData = {
  username: "Pradhan-07",
  totalContributions: stats.totalContributionsFallback || 213,
  currentStreak: 9,
  longestStreak: 21,
  weeks: [],
  isFallback: true,
};

const defaultLeetCode: LiveLeetCodeData = {
  username: "pradhan_07",
  totalSolved: stats.leetcodeSolved || 41,
  easySolved: stats.leetcodeBreakdown.easy || 22,
  mediumSolved: stats.leetcodeBreakdown.medium || 17,
  hardSolved: stats.leetcodeBreakdown.hard || 2,
  ranking: 3307013,
  recentSubmissions: [],
  isFallback: true,
};

const LiveStatsContext = createContext<LiveStatsContextType>({
  github: defaultGitHub,
  leetcode: defaultLeetCode,
  isSyncing: false,
  lastSyncedAt: null,
  refresh: async () => {},
});

export function LiveStatsProvider({ children }: { children: React.ReactNode }) {
  const [github, setGithub] = useState<LiveGitHubData>(defaultGitHub);
  const [leetcode, setLeetcode] = useState<LiveLeetCodeData>(defaultLeetCode);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const isFetchingRef = useRef(false);

  const fetchLiveStats = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsSyncing(true);

    try {
      // Fetch GitHub and LeetCode concurrently
      const [ghRes, lcRes] = await Promise.allSettled([
        fetch("/api/github", { cache: "no-store" }),
        fetch("/api/leetcode", { cache: "no-store" }),
      ]);

      if (ghRes.status === "fulfilled" && ghRes.value.ok) {
        const ghData = await ghRes.value.json();
        if (ghData && typeof ghData.totalContributions === "number") {
          setGithub(ghData);
        }
      }

      if (lcRes.status === "fulfilled" && lcRes.value.ok) {
        const lcData = await lcRes.value.json();
        if (lcData && typeof lcData.totalSolved === "number") {
          setLeetcode(lcData);
        }
      }

      setLastSyncedAt(new Date());
    } catch {
      // Retain previous state gracefully
    } finally {
      isFetchingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial immediate sync on mount (deferred to avoid synchronous setState warning)
    const initialTimer = setTimeout(() => {
      fetchLiveStats();
    }, 10);

    // 2. Continuous real-time polling every 60 seconds (1 minute)
    const interval = setInterval(() => {
      fetchLiveStats();
    }, 60000);

    // 3. Immediate sync on window focus or tab visibility resume
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLiveStats();
      }
    };

    window.addEventListener("focus", fetchLiveStats);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("focus", fetchLiveStats);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchLiveStats]);

  return (
    <LiveStatsContext.Provider
      value={{
        github,
        leetcode,
        isSyncing,
        lastSyncedAt,
        refresh: fetchLiveStats,
      }}
    >
      {children}
    </LiveStatsContext.Provider>
  );
}

export function useLiveStats() {
  return useContext(LiveStatsContext);
}
