"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TeamCard({
  name = "Md Rakibul Hasan",
  position = "Chief Coordinator",
  image,
  slug = "rahim-uddin",
}: {
  name?: string;
  position?: string;
  image?: string | null;
  slug?: string;
}) {
  return (
    <Link href={`/donor/${slug}`} className="block h-full">
      <motion.div
        whileHover={{ y: -10 }}
        className="p-3 rounded-[3rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-premium overflow-hidden group"
      >
        <div className="relative aspect-5/6 rounded-[2.5rem] overflow-hidden">
          {image ? (
            <Image
              className="object-cover group-hover:scale-110 transition-transform duration-1000"
              src={image}
              alt="Roster Personnel"
              fill
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-6 left-6 right-6 space-y-1">
            <p className="text-xl font-bold text-white tracking-tighter leading-none">
              {name}
            </p>
            <Badge size={"sm"} className="rounded-full">
              {position}
            </Badge>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
