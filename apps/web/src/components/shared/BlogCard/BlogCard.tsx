import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import type { BlogCardModel } from "@/lib/blog";

interface BlogCardProps {
  blog: BlogCardModel;
  index: number;
}

export const BlogCard = ({ blog, index }: BlogCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="h-full"
    >
      <Card className="shadow-none h-full border-primary/5 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-xl transition-all duration-300 group border flex flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800 animate-pulse-slow shrink-0">
          <div className="absolute top-4 left-6 z-10">
            <div className="px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase  shadow-lg">
              Community
            </div>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col flex-1 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase">
            <Calendar className="size-3 text-primary" />
            {new Date(blog.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <div className="space-y-3 flex-1">
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
              {blog.title}
            </h3>
            <p className="text-muted-foreground font-medium text-sm line-clamp-3 opacity-80 leading-relaxed">
              Discover how one pint of blood can save up to three lives and the
              incredible science behind safe donation.
            </p>
          </div>

          <Link
            href={`/blog/${blog.id}`}
            className="pt-4 border-t border-border/40 flex items-center justify-between group/link mt-auto"
          >
            <span className="text-[10px] font-black uppercase  text-primary">
              Read More
            </span>
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all">
              <ArrowRight className="size-4" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};
