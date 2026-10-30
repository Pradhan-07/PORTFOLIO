import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} — Karan Kumar Pradhan`,
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Simple clean markdown parser for headings, code blocks, bullet points, and paragraphs
  const renderMarkdownContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = "";

    lines.forEach((line, index) => {
      // Code block start / end
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.replace("```", "").trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre
              key={`code-${index}`}
              className="my-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/90 font-mono text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200"
            >
              {codeLang && (
                <div className="text-[10px] uppercase text-neutral-400 dark:text-neutral-500 mb-2 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                  {codeLang}
                </div>
              )}
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // H2 or H3
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-8 mb-3"
          >
            {line.replace("### ", "")}
          </h3>
        );
        return;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-neutral-100 mt-10 mb-4"
          >
            {line.replace("## ", "")}
          </h2>
        );
        return;
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li
            key={`li-${index}`}
            className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 ml-5 list-disc leading-relaxed my-1"
          >
            {line.replace(/^[-*]\s+/, "")}
          </li>
        );
        return;
      }

      // Empty line
      if (line.trim() === "") {
        return;
      }

      // Regular paragraph
      elements.push(
        <p
          key={`p-${index}`}
          className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed my-3"
        >
          {line}
        </p>
      );
    });

    return elements;
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20">
      {/* Back button */}
      <Link
        href="/writing"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        <span>back to all writing</span>
      </Link>

      {/* Meta Header */}
      <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs text-neutral-400 dark:text-neutral-500">
        <span>{post.date}</span>
        <span>·</span>
        <span>{post.readTime}</span>
        <div className="flex items-center gap-1.5 ml-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mb-6 leading-tight">
        {post.title}
      </h1>

      <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 border-l-2 border-neutral-300 dark:border-neutral-700 pl-4 py-1 italic mb-10">
        {post.summary}
      </p>

      {/* Content Body */}
      <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
        {renderMarkdownContent(post.content)}
      </div>

      {/* Bottom Footer Section */}
      <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
        <div>Author: Karan Kumar Pradhan (@Pradhan-07)</div>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/pradhankar65796"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
          >
            <span>discuss on x</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/Pradhan-07"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
          >
            <span>view github</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
