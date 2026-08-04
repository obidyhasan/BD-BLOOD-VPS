import type { BlogType } from "@/redux/features/blogs/blogsApi";

export type BlogCardModel = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  reads: number;
  image?: string;
  category: string;
};

export function mapApiBlog(blog: BlogType): BlogCardModel {
  return {
    id: blog.id,
    slug: blog.slug ?? blog.id,
    title: blog.title,
    excerpt:
      blog.content.slice(0, 160) + (blog.content.length > 160 ? "…" : ""),
    content: blog.content,
    author: blog.author?.fullName ?? "BD Blood",
    date:
      blog.published_at ??
      blog.publishedAt ??
      blog.created_at ??
      blog.createdAt ??
      "",
    reads: blog.reads,
    image: blog.coverImage ?? undefined,
    category: "Health",
  };
}
