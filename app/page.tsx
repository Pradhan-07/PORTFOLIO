import React from "react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { ProjectCard } from "@/components/ProjectCard";
import { Timeline } from "@/components/Timeline";
import { QuickTakes } from "@/components/QuickTakes";
import { LetsTalk } from "@/components/LetsTalk";
import { getSortedProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/posts";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const allProjects = getSortedProjects();
  const featuredProjects = allProjects.slice(0, 4); // Top 4 projects on index
  const posts = getAllPosts().slice(0, 3); // 3 blog posts

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <Hero />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 2. THINGS I'VE BUILT SECTION */}
        <section className="w-full my-16 sm:my-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                [ FEATURED // SELECTED WORK ]
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
                Things I&apos;ve built
              </h2>
            </div>

            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <span>view all projects</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Grid of Top 4 Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white transition-all shadow-sm group"
            >
              <span>see all {allProjects.length} projects & experiments</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* 3. WRITING SECTION */}
        <section className="w-full my-16 sm:my-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                [ ESSAYS // DEV NOTES ]
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-100 mt-2">
                Writing
              </h2>
            </div>

            <Link
              href="/writing"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <span>view all posts</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* List of Blog Posts */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/writing/${post.slug}`}
                className="group py-6 block transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 px-3 -mx-3 rounded-xl"
              >
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {post.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  {post.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. MILESTONES (LATEST 3) */}
        <Timeline limit={3} />

        {/* 5. QUICK TAKES SECTION */}
        <QuickTakes />

        {/* 6. LET'S TALK SECTION */}
        <LetsTalk />
      </div>
    </div>
  );
}
