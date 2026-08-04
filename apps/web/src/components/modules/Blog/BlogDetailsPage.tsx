"use client";

import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import {
  UserRound,
  ArrowUpRight,
  Share2,
  Heart,
  MoveLeft,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  useGetPublicBlogBySlugQuery,
  useGetPublicBlogsQuery,
  useIncrementReadCountMutation,
} from "@/redux/features/blogs/blogsApi";
import { mapApiBlog, type BlogCardModel } from "@/lib/blog";
import type { BlogType } from "@/redux/features/blogs/blogsApi";

type BlogDetailsPageProps = {
  slug?: string;
  initialBlog?: BlogType | null;
  initialRelated?: BlogType[];
};

const BlogDetailsPage = ({
  slug,
  initialBlog,
  initialRelated,
}: BlogDetailsPageProps) => {
  const { data: blogData, isLoading: loading } = useGetPublicBlogBySlugQuery(
    slug ?? "",
    {
      skip: !slug || !!initialBlog,
    },
  );
  const { data: allBlogsData } = useGetPublicBlogsQuery(
    { limit: 20 },
    { skip: !!initialRelated?.length },
  );

  const blog = useMemo(() => {
    const source = initialBlog ?? blogData?.data;
    return source ? mapApiBlog(source) : null;
  }, [initialBlog, blogData]);

  // Fire-and-forget read increment once per mount
  const [incrementRead] = useIncrementReadCountMutation();
  const readFired = useRef(false);
  useEffect(() => {
    if (blog?.id && !readFired.current) {
      readFired.current = true;
      incrementRead(blog.id);
    }
  }, [blog?.id, incrementRead]);

  const relatedBlogs: BlogCardModel[] = useMemo(() => {
    if (!slug) return [];
    return (initialRelated ?? allBlogsData?.data ?? [])
      .map(mapApiBlog)
      .filter((b) => b.slug !== slug)
      .slice(0, 3);
  }, [initialRelated, allBlogsData, slug]);

  const isLoading = !initialBlog && loading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary/40" />
        <p className="text-[10px] font-black uppercase  opacity-40">
          Syncing Registry Portals...
        </p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-black uppercase tracking-tighter">
          Article Not Found
        </p>
        <Link href="/blog">
          <Button
            variant="outline"
            className="rounded-xl font-black text-xs uppercase "
          >
            <MoveLeft className="mr-2 size-4" /> Back to Journal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content Ledger */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-12"
        >
          <div className="space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-[1.1] uppercase">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between py-6 border-y border-border/40 border-dashed">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-primary border border-border/40">
                  <UserRound className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                    Verified Editorial
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {blog.author}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                    Timestamp
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {blog.date}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer border border-border/20">
                  <Share2 className="size-4" />
                </div>
              </div>
            </div>
          </div>

          <figure className="relative aspect-[16/9] rounded-[3rem] overflow-hidden border border-border/40 group shadow-2xl shadow-primary/5">
            <Image
              src={blog.image ?? ""}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </figure>

          <div className="space-y-10">
            <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-muted-foreground text-lg font-medium leading-relaxed">
              {blog.content.split("\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[3rem] bg-zinc-950 text-white relative overflow-hidden group my-16">
            <Heart className="absolute -bottom-6 -right-6 size-48 text-white/5 -rotate-12 transition-transform duration-1000 group-hover:scale-110" />
            <p className="relative z-10 text-xl md:text-2xl font-black tracking-tight  leading-relaxed">
              {`"Every verified entry in our registry is a potential life saved.
              We prioritize accuracy over volume."`}
            </p>
          </div>
        </motion.article>

        {/* Info Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          <div className="p-10 rounded-[3rem] bg-zinc-50/50 dark:bg-zinc-900 border border-border/50 space-y-10 shadow-premium sticky top-10">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-foreground uppercase  flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                Network Insights
              </h4>
              <div className="space-y-8">
                {relatedBlogs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blog/${b.slug}`}
                    className="group block space-y-4"
                  >
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border/40 shadow-sm transition-all group-hover:shadow-premium group-hover:border-primary/20">
                      <Image
                        src={b.image ?? ""}
                        alt={b.title}
                        width={400}
                        height={250}
                        className="object-cover group-hover:scale-110 transition-transform duration-700 h-full"
                      />
                    </div>
                    <div className="space-y-1 px-1">
                      <h5 className="font-black text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors uppercase tracking-tight">
                        {b.title}
                      </h5>
                      <span className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase">
                        {b.date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <Separator className="bg-border/40" />
            <div className="space-y-6">
              <h4 className="text-xs font-black text-foreground uppercase ">
                Article Stats
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-zinc-800 border border-border/40 text-center">
                  <p className="text-[10px] font-black opacity-40 uppercase  mb-1">
                    Reads
                  </p>
                  <p className="text-2xl font-black  tracking-tighter">
                    {blog.reads > 1000
                      ? `${(blog.reads / 1000).toFixed(1)}K`
                      : blog.reads}
                  </p>
                </div>
                <div className="p-5 rounded-3xl bg-white dark:bg-zinc-800 border border-border/40 text-center">
                  <p className="text-[10px] font-black opacity-40 uppercase  mb-1">
                    Registry
                  </p>
                  <p className="text-2xl font-black  tracking-tighter text-primary">
                    #{blog.id.substring(0, 3)}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/register" className="block">
              <Button className="w-full h-16 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-900 transition-all group">
                Join Network Hub
                <ArrowUpRight className="ml-2 size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogDetailsPage;
