#!/usr/bin/env node
/**
 * generate-snapshots.mjs — snapshot data pipeline (Phase 3 / G8)
 * ================================================================
 * Pulls Karan's public stats from their upstream APIs ONCE, at build/dev
 * time, and writes versioned JSON snapshots into `public/data/`. The site
 * itself reads ONLY these same-origin files at runtime — no third-party
 * API calls from the browser, so a stale snapshot is a content problem,
 * never a runtime failure.
 *
 * Sources
 *   - GitHub REST API            https://api.github.com/users/Pradhan-07 (+ /repos, /languages)
 *   - Contributions (build-time) https://github-contributions-api.jogruber.de/v4/Pradhan-07?y=last
 *   - LeetCode GraphQL           https://leetcode.com/graphql (user pradhan_07)
 *
 * Outputs (each carries a top-level `fetchedAt` ISO timestamp + `source`)
 *   - public/data/github-snapshot.json  account totals, repo metadata, per-day contributions + streaks
 *   - public/data/stack.json            language byte totals / share / repo counts
 *   - public/data/months.json           per-month contribution totals + top pushed repos ("the log")
 *   - public/data/leetcode.json         solved / submissions / acceptance / calendar / contest / badges
 *
 * HOW TO REGENERATE (manual — this repo has no CI)
 *   node scripts/generate-snapshots.mjs        # or: npm run snapshots
 *   Then commit the updated public/data/*.json files together with any
 *   code change that consumes them. Unauthenticated GitHub API calls are
 *   rate-limited (60/hr); set GITHUB_TOKEN in the environment to raise it.
 *
 * Failure behaviour: if ANY source fetch fails, the script exits non-zero
 * and writes NOTHING, so the previously committed snapshots stay intact.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_USER = 'Pradhan-07';
const LEETCODE_USER = 'pradhan_07';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, 'public', 'data');

const fetchedAt = new Date().toISOString();

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'user-agent': 'karan-portfolio-snapshot-generator',
      accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

/** Longest run of active days + current streak (a zero-count today does not break a streak that ran through yesterday). */
function computeStreaks(days) {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
  let longest = 0;
  let run = 0;
  for (const day of sorted) {
    run = day.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  let current = 0;
  let idx = sorted.length - 1;
  if (idx >= 0 && sorted[idx].count === 0) idx--; // today still in progress
  while (idx >= 0 && sorted[idx].count > 0) {
    current++;
    idx--;
  }
  return { currentStreak: current, longestStreak: longest };
}

async function main() {
  console.log(`Generating snapshots for GitHub:${GITHUB_USER} / LeetCode:${LEETCODE_USER} …`);

  const ghHeaders = process.env.GITHUB_TOKEN
    ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {};

  // --- (a) GitHub user + repos + languages ---------------------------------
  const user = await fetchJson(`https://api.github.com/users/${GITHUB_USER}`, { headers: ghHeaders });
  const reposRaw = await fetchJson(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed&direction=desc`,
    { headers: ghHeaders }
  );
  const ownRepos = reposRaw.filter((r) => !r.fork);

  const repos = [];
  const languageBytes = new Map(); // name -> total bytes
  const languageRepoCount = new Map(); // name -> # repos containing it
  for (const repo of ownRepos) {
    const langs = await fetchJson(repo.languages_url, { headers: ghHeaders }).catch(() => ({}));
    for (const [name, bytes] of Object.entries(langs)) {
      languageBytes.set(name, (languageBytes.get(name) ?? 0) + bytes);
      languageRepoCount.set(name, (languageRepoCount.get(name) ?? 0) + 1);
    }
    repos.push({
      name: repo.name,
      description: repo.description ?? null,
      topics: repo.topics ?? [],
      homepage: repo.homepage || null,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      language: repo.language ?? null,
      languages: langs,
      license: repo.license?.spdx_id ?? null,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      defaultBranch: repo.default_branch,
      sizeKb: repo.size,
    });
  }

  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks, 0);

  // --- (b) Contributions (last year) ---------------------------------------
  const contribRaw = await fetchJson(
    `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`
  );
  const days = (contribRaw.contributions ?? []).map((d) => ({
    date: d.date,
    count: d.count,
    level: d.level ?? 0,
  }));
  const daySum = days.reduce((sum, d) => sum + d.count, 0);
  const totalLastYear = contribRaw.total?.lastYear ?? daySum;
  const { currentStreak, longestStreak } = computeStreaks(days);

  const githubSnapshot = {
    fetchedAt,
    source: 'GitHub REST API (api.github.com) + github-contributions-api.jogruber.de — fetched at generation time only; the site reads this file same-origin',
    user: {
      login: user.login,
      name: user.name ?? null,
      profileUrl: user.html_url,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
    },
    totals: { stars: totalStars, forks: totalForks },
    repos,
    contributions: {
      totalLastYear,
      currentStreak,
      longestStreak,
      days,
    },
  };

  // --- stack.json ------------------------------------------------------------
  const totalBytes = [...languageBytes.values()].reduce((a, b) => a + b, 0);
  const stack = {
    fetchedAt,
    source: 'GitHub REST API /repos/{owner}/{repo}/languages, summed over all non-fork repos',
    totalBytes,
    reposAudited: repos.length,
    languages: [...languageBytes.entries()]
      .map(([name, bytes]) => ({
        name,
        bytes,
        share: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 10000 : 0,
        repos: languageRepoCount.get(name) ?? 0,
      }))
      .sort((a, b) => b.bytes - a.bytes),
  };

  // --- months.json ("the log") ----------------------------------------------
  const monthTotals = new Map(); // YYYY-MM -> contributions
  for (const day of days) {
    const key = day.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + day.count);
  }
  const reposByMonth = new Map(); // YYYY-MM -> repos pushed that month
  for (const repo of repos) {
    const key = (repo.pushedAt ?? '').slice(0, 7);
    if (!key) continue;
    if (!reposByMonth.has(key)) reposByMonth.set(key, []);
    reposByMonth.get(key).push({ name: repo.name, pushedAt: repo.pushedAt, url: repo.url });
  }
  const monthKeys = [...new Set([...monthTotals.keys(), ...reposByMonth.keys()])].sort();
  const months = {
    fetchedAt,
    source: 'Derived at generation time from the contributions snapshot (monthly totals) and GitHub repo pushedAt timestamps (top repos)',
    months: monthKeys.map((key) => ({
      month: key,
      contributions: monthTotals.get(key) ?? 0,
      topRepos: (reposByMonth.get(key) ?? [])
        .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
        .slice(0, 3),
    })),
  };

  // --- (c) LeetCode -----------------------------------------------------------
  const lcQuery = `
    query userData($username: String!) {
      allQuestionsCount { difficulty count }
      matchedUser(username: $username) {
        username
        profile { ranking reputation }
        submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
          totalSubmissionNum { difficulty count submissions }
        }
        userCalendar { streak totalActiveDays activeYears }
        badges { id displayName icon }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        attendedContestsCount
      }
    }`;
  const lc = await fetchJson('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', referer: `https://leetcode.com/u/${LEETCODE_USER}/` },
    body: JSON.stringify({ query: lcQuery, variables: { username: LEETCODE_USER } }),
  });
  if (lc.errors || !lc.data?.matchedUser) {
    throw new Error(`LeetCode GraphQL failed: ${JSON.stringify(lc.errors ?? 'no matchedUser')}`);
  }
  const mu = lc.data.matchedUser;
  const byDifficulty = (rows) => {
    const out = {};
    for (const row of rows ?? []) out[row.difficulty.toLowerCase()] = { count: row.count, submissions: row.submissions };
    return out;
  };
  const ac = byDifficulty(mu.submitStatsGlobal?.acSubmissionNum);
  const totalSubs = byDifficulty(mu.submitStatsGlobal?.totalSubmissionNum);
  const acceptedTotal = ac.all?.submissions ?? 0;
  const submissionsTotal = totalSubs.all?.submissions ?? 0;
  const leetcode = {
    fetchedAt,
    source: 'LeetCode GraphQL (leetcode.com/graphql), public profile stats',
    username: mu.username,
    profileUrl: `https://leetcode.com/u/${LEETCODE_USER}/`,
    ranking: mu.profile?.ranking ?? null,
    reputation: mu.profile?.reputation ?? null,
    solved: {
      easy: ac.easy?.count ?? 0,
      medium: ac.medium?.count ?? 0,
      hard: ac.hard?.count ?? 0,
      all: ac.all?.count ?? 0,
    },
    acceptedSubmissions: {
      easy: ac.easy?.submissions ?? 0,
      medium: ac.medium?.submissions ?? 0,
      hard: ac.hard?.submissions ?? 0,
      all: acceptedTotal,
    },
    attemptedProblems: {
      easy: totalSubs.easy?.count ?? 0,
      medium: totalSubs.medium?.count ?? 0,
      hard: totalSubs.hard?.count ?? 0,
      all: totalSubs.all?.count ?? 0,
    },
    totalSubmissions: {
      easy: totalSubs.easy?.submissions ?? 0,
      medium: totalSubs.medium?.submissions ?? 0,
      hard: totalSubs.hard?.submissions ?? 0,
      all: submissionsTotal,
    },
    acceptanceRate: submissionsTotal > 0 ? Math.round((acceptedTotal / submissionsTotal) * 1000) / 1000 : null,
    calendar: {
      streak: mu.userCalendar?.streak ?? 0,
      totalActiveDays: mu.userCalendar?.totalActiveDays ?? 0,
      activeYears: mu.userCalendar?.activeYears ?? [],
    },
    contest: lc.data.userContestRanking
      ? {
          rating: lc.data.userContestRanking.rating,
          globalRanking: lc.data.userContestRanking.globalRanking,
          attendedContestsCount: lc.data.userContestRanking.attendedContestsCount,
        }
      : null,
    badges: (mu.badges ?? []).map((b) => ({ id: b.id, displayName: b.displayName })),
    platformTotals: Object.fromEntries(
      (lc.data.allQuestionsCount ?? []).map((q) => [q.difficulty.toLowerCase(), q.count])
    ),
  };

  // --- Write everything (only after every fetch succeeded) -------------------
  await mkdir(outDir, { recursive: true });
  const files = {
    'github-snapshot.json': githubSnapshot,
    'stack.json': stack,
    'months.json': months,
    'leetcode.json': leetcode,
  };
  for (const [name, data] of Object.entries(files)) {
    await writeFile(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`  wrote public/data/${name}`);
  }
  console.log(
    `Done. contributions=${totalLastYear} currentStreak=${currentStreak} longestStreak=${longestStreak} ` +
      `stars=${totalStars} languages=${stack.languages.length} leetcodeSolved=${leetcode.solved.all}`
  );
}

main().catch((err) => {
  console.error(`Snapshot generation FAILED — existing snapshots left untouched.\n  ${err.message}`);
  process.exit(1);
});
