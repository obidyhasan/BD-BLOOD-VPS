"use client";

import Link from "next/link";
import { ArrowLeft, Droplets } from "lucide-react";
import { BDLogo } from "@/components/ui/bd-logo";
import { motion } from "motion/react";
import React from "react";

interface AuthWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  visualTitle: string;
  visualSubtitle: string;
}

const AuthWrapper = ({
  children,
  title,
  subtitle,
  visualTitle,
  visualSubtitle,
}: AuthWrapperProps) => {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Visual Side - Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 opacity-40 z-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-96 -mt-96" />

        <div className="relative z-20 space-y-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="size-24 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl"
          >
            <Droplets className="size-12 fill-white animate-pulse" />
          </motion.div>

          <div className="space-y-6 py-4">
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase whitespace-pre-line">
              {visualTitle}
            </h1>
            <p className="text-white/60 font-medium text-lg leading-relaxed ">
              {visualSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col px-6 py-16 relative bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto">
        <Link
          href="/"
          className=" inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-xs uppercase  group absolute top-6 left-6"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="m-auto w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-right duration-700">
          <div className="space-y-4 text-center lg:text-left">
            {/* <BDLogo size="lg" className="mb-8 mx-auto lg:mx-0" /> */}
            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              {title}
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {subtitle}
            </p>
          </div>

          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;
