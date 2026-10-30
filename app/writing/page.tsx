import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Writing & Dev Notes — Karan Kumar Pradhan",
  description:
    "Reflections on C++ data structures, web development experiments, IoT hardware, and building in public.",
};

export default function WritingPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
      <div className="mb-12 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          [ ARCHIVE // WRITING ]
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mt-2 mb-3">
          Dev Notes &amp; Essays
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Short technical reflections on learning C++ DSA, full-stack web experiments, and hardware lessons from VIT-AP.
        </p>
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/writing/${post.slug}`}
            className="group py-8 block transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 px-4 -mx-4 rounded-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2.5 font-mono text-xs text-neutral-400 dark:text-neutral-500">
              <div className="flex items-center gap-2">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                {post.title}
              </h2>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1.5" />
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2.5 leading-relaxed">
              {post.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
