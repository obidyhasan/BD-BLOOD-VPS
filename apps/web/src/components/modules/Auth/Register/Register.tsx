"use client";

import Link from "next/link";
import { BDLogo } from "@/components/ui/bd-logo";
import DonorForm from "./DonorForm";
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

const Register = () => {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Form Side - Primary focus for Register */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 relative bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto order-2 lg:order-1 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-xs uppercase  group absolute top-6 left-6"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className=" m-auto w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-4 text-center lg:text-left">
            <BDLogo size="lg" className="mb-8 mx-auto lg:mx-0" />
            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              Create Profile
            </h2>
            <p className="text-muted-foreground font-medium text-base">
              {`Join the nation's fastest-growing emergency blood network.`}
            </p>
          </div>

          <div className="space-y-6">
            <DonorForm />
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-center text-sm font-bold text-muted-foreground">
              Already a member?
              <Link
                className="ml-2 text-primary hover:underline decoration-2 underline-offset-4"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Visual Side - Right focus for Register desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center p-20 order-1 lg:order-2">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/30 via-transparent to-primary/10 opacity-40 z-10" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -ml-96 -mb-96" />

        <div className="relative z-20 space-y-12 max-w-2xl text-right">
          <div className="flex justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="size-24 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl"
            >
              <HeartPulse className="size-12 text-white animate-pulse" />
            </motion.div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase">
              Empowering <br /> Heroes.
            </h1>
            <p className="text-white/60 font-medium text-lg leading-relaxed">
              Every donation is a story of hope. Our platform ensures your
              contribution reaches the right recipient at the absolute moment of
              crisis.
            </p>
          </div>

          <div className="flex flex-col gap-4 items-end pt-6">
            {[
              { icon: Sparkles, text: "Real-time SMS alerts" },
              { icon: ShieldCheck, text: "Verified by medical experts" },
              { icon: UserPlus, text: "Dedicated donor support" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white p-2">
                <span className="text-xs font-semibold uppercase  opacity-80">
                  {item.text}
                </span>
                <item.icon className="size-5 text-primary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
