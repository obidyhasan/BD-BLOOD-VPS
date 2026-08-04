"use client";
import { BDLogo } from "@/components/ui/bd-logo";
import { motion } from "motion/react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950">
      <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Gradients */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-red-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Container with Glow */}
          <div className="relative mb-8">
            {/* Ambient Glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
            />

            {/* Logo Animation */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [0.95, 1, 0.95],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <BDLogo size="lg" className="text-4xl md:text-5xl opacity-90" />
            </motion.div>
          </div>

          {/* Loading Indicator */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-1 w-32 bg-secondary/30 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1"
            >
              Loading...
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
