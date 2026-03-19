import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: string;
  image?: string;
}

export interface BlogPostFull extends BlogPostMeta {
  content: string;
}

const POSTS_DIR = path.join(process.cwd(), "content/blog");

// ── File-based posts (from content/blog/*.mdx) ────────────

function getFilePosts(): BlogPostFull[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      const stats = readingTime(content);

      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || "",
        author: data.author || "Connect Reward Team",
        category: data.category || "General",
        tags: data.tags || [],
        readingTime: stats.text,
        image: data.image || undefined,
        content,
      };
    });
}

// ── Database posts (from blog_posts table) ─────────────────

async function getDbPosts(): Promise<BlogPostFull[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });

    return (data ?? []).map((p) => {
      const stats = readingTime(p.content || "");
      return {
        slug: p.slug,
        title: p.title,
        description: p.description || "",
        date: p.published_at || p.created_at,
        author: p.author || "Connect Reward Team",
        category: p.category || "General",
        tags: p.tags || [],
        readingTime: stats.text,
        image: p.image || undefined,
        content: p.content || "",
      };
    });
  } catch {
    return [];
  }
}

// ── Combined (DB posts take priority over file posts with same slug) ───

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const [dbPosts, filePosts] = await Promise.all([getDbPosts(), Promise.resolve(getFilePosts())]);

  const slugSet = new Set<string>();
  const combined: BlogPostFull[] = [];

  // DB posts first (higher priority)
  for (const post of dbPosts) {
    slugSet.add(post.slug);
    combined.push(post);
  }

  // File posts (only if slug not already in DB)
  for (const post of filePosts) {
    if (!slugSet.has(post.slug)) {
      slugSet.add(post.slug);
      combined.push(post);
    }
  }

  return combined
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(({ content, ...meta }) => meta);
}

export async function getPostBySlug(slug: string): Promise<BlogPostFull | null> {
  // Check DB first
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (data) {
      const stats = readingTime(data.content || "");
      return {
        slug: data.slug,
        title: data.title,
        description: data.description || "",
        date: data.published_at || data.created_at,
        author: data.author || "Connect Reward Team",
        category: data.category || "General",
        tags: data.tags || [],
        readingTime: stats.text,
        image: data.image || undefined,
        content: data.content || "",
      };
    }
  } catch { /* fall through to file check */ }

  // Check files
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || "",
    author: data.author || "Connect Reward Team",
    category: data.category || "General",
    tags: data.tags || [],
    readingTime: stats.text,
    image: data.image || undefined,
    content,
  };
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  return [...new Set(posts.map((p) => p.category))];
}
