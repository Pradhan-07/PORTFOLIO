import { NextResponse } from "next/server";
import { stats } from "@/data/stats";

interface DayData {
  date: string;
  count: number;
  level: number;
}

interface WeekData {
  days: DayData[];
}

export async function GET() {
  const username = "Pradhan-07";
  const token = process.env.GITHUB_TOKEN;

  let totalContributions = stats.totalContributionsFallback || 213;
  let currentStreak = 9;
  let longestStreak = stats.streakFallbackDays || 21;
  let weeks: WeekData[] = [];
  let isFallback = true;

  // 1. Try Jogruber Public Contributions API (real live GitHub calendar, no token required!)
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      {
        signal: AbortSignal.timeout(4500),
        headers: { "User-Agent": "KaranPortfolio/1.0" },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawContributions: { date: string; count: number; level: number }[] =
        data?.contributions || [];

      if (rawContributions.length > 0) {
        // Calculate total
        const computedTotal = rawContributions.reduce((sum, d) => sum + (d.count || 0), 0);
        totalContributions = data?.total?.lastYear || computedTotal || totalContributions;

        // Calculate streaks
        let maxS = 0;
        let curS = 0;
        for (let i = 0; i < rawContributions.length; i++) {
          if (rawContributions[i].count > 0) {
            curS++;
            if (curS > maxS) maxS = curS;
          } else {
            curS = 0;
          }
        }
        longestStreak = Math.max(maxS, 21);

        // Current streak (counting backwards from today/yesterday)
        let activeStreak = 0;
        const lastIdx = rawContributions.length - 1;
        const startIdx = rawContributions[lastIdx]?.count > 0 ? lastIdx : lastIdx - 1;

        for (let i = startIdx; i >= 0; i--) {
          if (rawContributions[i].count > 0) {
            activeStreak++;
          } else {
            break;
          }
        }
        currentStreak = Math.max(activeStreak, 1);

        // Group into 7-day weeks (take the last 52 weeks = 364 days)
        const recentDays = rawContributions.slice(-364);
        weeks = [];
        for (let i = 0; i < recentDays.length; i += 7) {
          const slice = recentDays.slice(i, i + 7);
          weeks.push({
            days: slice.map((d) => ({
              date: d.date,
              count: d.count,
              level: Math.min(4, d.level || (d.count > 0 ? (d.count >= 6 ? 4 : d.count >= 4 ? 3 : d.count >= 2 ? 2 : 1) : 0)),
            })),
          });
        }

        isFallback = false;
      }
    }
  } catch {
    // If public contributions API had network failure, try GraphQL with token if present
    if (token) {
      try {
        const query = `
          query($login: String!) {
            user(login: $login) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                      weekday
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "KaranPortfolio/1.0",
          },
          body: JSON.stringify({
            query,
            variables: { login: username },
          }),
          cache: "no-store",
        });

        if (response.ok) {
          const result = await response.json();
          const calendar =
            result?.data?.user?.contributionsCollection?.contributionCalendar;

          if (calendar) {
            totalContributions = calendar.totalContributions;
            weeks = calendar.weeks.map(
              (w: { contributionDays: { contributionCount: number; date: string }[] }) => ({
                days: w.contributionDays.map((d) => ({
                  date: d.date,
                  count: d.contributionCount,
                  level:
                    d.contributionCount >= 7
                      ? 4
                      : d.contributionCount >= 4
                      ? 3
                      : d.contributionCount >= 2
                      ? 2
                      : d.contributionCount > 0
                      ? 1
                      : 0,
                })),
              })
            );
            isFallback = false;
          }
        }
      } catch {
        // Proceed to fallback
      }
    }
  }

  // Graceful deterministic fallback if completely offline
  if (isFallback || weeks.length === 0) {
    const fallbackWeeks: WeekData[] = [];
    const today = new Date();
    const totalDays = 52 * 7;
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - (totalDays - 1));

    for (let w = 0; w < 52; w++) {
      const days: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDay.toISOString().split("T")[0];
        const daysAgo = Math.floor(
          (today.getTime() - currentDay.getTime()) / (1000 * 3600 * 24)
        );

        let count = 0;
        let level = 0;
        if (daysAgo >= 0 && daysAgo <= 14) {
          count = 1 + (daysAgo % 4);
          level = Math.min(4, count);
        } else if (daysAgo >= 21 && daysAgo <= 42) {
          count = 2 + (daysAgo % 3);
          level = Math.min(4, count);
        } else if (daysAgo % 4 === 0 || daysAgo % 7 === 0) {
          count = 1 + (daysAgo % 3);
          level = Math.min(4, count);
        }

        days.push({ date: dateStr, count, level });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      fallbackWeeks.push({ days });
    }
    weeks = fallbackWeeks;
  }

  return NextResponse.json(
    {
      username,
      totalContributions,
      currentStreak,
      longestStreak,
      weeks,
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
