"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Users, ArrowRight } from "lucide-react";

interface CommitteeCardProps {
  name: string;
  orgId: string;
  logo?: string | null;
  location?: string;
  members?: number;
  description?: string | null;
}

const CommitteeCard = ({
  name,
  orgId,
  logo,
  location,
  members,
  description,
}: CommitteeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/organization/${orgId}`}>
        <div className="rounded-[2rem] border border-primary/5 p-4 bg-white dark:bg-zinc-900 hover:shadow-xl transition-all duration-300">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
            <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 animate-shimmer">
              {logo ? (
                <Image src={logo} alt={name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-black text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {(members ?? 0) > 0 && (
              <div className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-md border border-white/30 text-white text-[10px] font-semibold ">
                <Users className="size-3" />
                {members} Members
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              {/* {location && (
                <p className="text-xs text-muted-foreground font-medium">
                  📍 {location}
                </p>
              )} */}
              {description && (
                <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between group/link">
              <span className="text-[10px] font-black uppercase  text-muted-foreground">
                View Organization
              </span>
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all">
                <ArrowRight className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CommitteeCard;
