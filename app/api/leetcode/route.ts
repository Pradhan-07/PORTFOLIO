import { NextResponse } from "next/server";
import { stats } from "@/data/stats";

export async function GET() {
  const username = "pradhan_07";

  let totalSolved = stats.leetcodeSolved;
  let easySolved = stats.leetcodeBreakdown.easy;
  let mediumSolved = stats.leetcodeBreakdown.medium;
  let hardSolved = stats.leetcodeBreakdown.hard;
  let ranking = 3307013;
  let recentSubmissions: {
    title: string;
    status: string;
    lang: string;
    timestamp: string;
  }[] = [];
  let isFallback = true;

  // 1. Try Primary LeetCode API (alfa-leetcode-api)
  try {
    const res = await fetch(
      `https://alfa-leetcode-api.onrender.com/userProfile/${username}`,
      {
        signal: AbortSignal.timeout(4500),
        headers: { "User-Agent": "KaranPortfolio/1.0" },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (typeof data.totalSolved === "number" && data.totalSolved > 0) {
        totalSolved = data.totalSolved;
        easySolved = data.easySolved ?? easySolved;
        mediumSolved = data.mediumSolved ?? mediumSolved;
        hardSolved = data.hardSolved ?? hardSolved;
        ranking = data.ranking ?? ranking;

        if (Array.isArray(data.recentSubmissions)) {
          recentSubmissions = data.recentSubmissions
            .slice(0, 5)
            .map((s: { title?: string; statusDisplay?: string; lang?: string; timestamp?: string }) => ({
              title: s.title || "Problem",
              status: s.statusDisplay || "Accepted",
              lang: s.lang || "cpp",
              timestamp: s.timestamp || "",
            }));
        }

        isFallback = false;
      }
    }
  } catch {
    // Try Secondary API if primary fails
    try {
      const res = await fetch(
        `https://leetcode-api-faisalshohag.vercel.app/${username}`,
        {
          signal: AbortSignal.timeout(3500),
          headers: { "User-Agent": "KaranPortfolio/1.0" },
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (typeof data.totalSolved === "number" && data.totalSolved > 0) {
          totalSolved = data.totalSolved;
          easySolved = data.easySolved ?? easySolved;
          mediumSolved = data.mediumSolved ?? mediumSolved;
          hardSolved = data.hardSolved ?? hardSolved;
          ranking = data.ranking ?? ranking;
          isFallback = false;
        }
      }
    } catch {
      // Graceful fallback to verified current numbers
    }
  }

  return NextResponse.json(
    {
      username,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking,
      recentSubmissions,
      lastUpdated: new Date().toISOString(),
      isFallback,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
