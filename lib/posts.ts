import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/posts");

export interface Post {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  tags: string[];
  summary: string;
  content: string;
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((fileName) => fileName.endsWith(".md") || fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || "Untitled",
        date: data.date || "",
        readTime: data.readTime || "3 min read",
        tags: data.tags || [],
        summary: data.summary || "",
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const mdPath = path.join(postsDirectory, `${slug}.md`);
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
    const targetPath = fs.existsSync(mdPath) ? mdPath : fs.existsSync(mdxPath) ? mdxPath : null;

    if (!targetPath) return null;

    const fileContents = fs.readFileSync(targetPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || "Untitled",
      date: data.date || "",
      readTime: data.readTime || "3 min read",
      tags: data.tags || [],
      summary: data.summary || "",
      content,
    };
  } catch {
    return null;
  }
}
