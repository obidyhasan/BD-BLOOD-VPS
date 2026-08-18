"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowUpRight,
  Heart,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { motion } from "motion/react";
import { getPostPath, type LegacyPost as Post } from "@/lib/post";
import { cn } from "@/lib/utils";

interface WorkCardProps {
  post: Post;
  isAdmin?: boolean;
  onToggleWork?: (id: string) => void;
}

const WorkCard = ({ post, isAdmin, onToggleWork }: WorkCardProps) => {
  const postPath = getPostPath(post);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group bg-white dark:bg-zinc-950 border border-border/40 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-premium flex flex-col h-full"
    >
      <div className="relative">
        <Link href={postPath} className="block">
          {/* Visual Media */}
          <div className="relative aspect-16/10 overflow-hidden bg-zinc-100 dark:bg-zinc-900 group/media">
            {post.images && post.images.length > 0 ? (
              <Image
                src={post.images[0]}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover/media:scale-110"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                <div className="flex flex-col items-center gap-2 opacity-10">
                  <Briefcase className="size-12" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    {post.type}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover/media:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-all z-20 translate-y-4 group-hover/media:translate-y-0 duration-500">
              <div className="size-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-2xl">
                <ArrowUpRight className="size-6" />
              </div>
            </div>
          </div>
        </Link>

        {/* Admin Selection Overlay */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-30">
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWork?.(post.id);
              }}
              className={cn(
                "px-4 py-2 rounded-xl font-black text-[10px] uppercase  transition-all shadow-xl",
                post.isWork
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-zinc-950 dark:text-white border border-white/20 hover:bg-primary hover:text-white hover:border-primary",
              )}
            >
              {post.isWork ? "In Works" : "Add to Work"}
            </button>
          </div>
        )}
      </div>

      {/* Content Block */}
      <div className="p-7 space-y-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex size-10 items-center justify-center rounded-xl border border-border/40 bg-primary/10 text-sm font-black text-primary shadow-sm">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full flex items-center justify-center">
              <ShieldCheck className="size-2 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground tracking-tight">
              {post.author}
            </h4>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-muted-foreground uppercase font-black  opacity-60">
                {post.org}
              </p>
            </div>
          </div>
        </div>

        <Link href={postPath} className="block group/title">
          <h3 className="text-xl font-black text-foreground leading-tight tracking-tight group-hover/title:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3 opacity-80 flex-1">
          {post.content ||
            "Discover the impact of this humanitarian mission and how it contributed to the community's well-being."}
        </p>

        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-5 text-muted-foreground/60">
            <div className="flex items-center gap-2 group/stat cursor-pointer hover:text-rose-500 transition-colors">
              <Heart className="size-4 group-hover/stat:fill-rose-500" />
              <span className="text-[10px] font-black ">
                {post.likeCount ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 group/stat cursor-pointer hover:text-primary transition-colors">
              <MessageCircle className="size-4" />
              <span className="text-[10px] font-black ">
                {post.commentCount ?? 0}
              </span>
            </div>
          </div>
          <Link
            href={postPath}
            className="text-[10px] font-black uppercase  text-primary hover:tracking-[0.2em] transition-all"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkCard;
