"use client";

import { motion } from "motion/react";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { philosophyItems } from "@/lib/siteContent";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-primary/10 -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Badge variant="primary" className="rounded-full px-4 py-1.5 text-xs font-black uppercase  shadow-xl shadow-primary/10">
                Our Story
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black text-foreground tracking-tighter leading-none uppercase"
            >
              Saving Lives, <br /> One Pint At A Time.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl"
            >
              BD BLOOD is an online platform that connects blood donors with people who urgently need blood, all across Bangladesh.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-border/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">Our Mission</h2>
              <p className="text-lg text-muted-foreground font-semibold leading-relaxed pl-6 border-l-4 border-primary/20">
                To democratize access to emergency blood donation through technology, transparency, and a nationwide network of verified volunteers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {philosophyItems.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <item.icon className="size-6" />
                  </div>
                  <h4 className="font-black text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-8 border-white dark:border-zinc-800 shadow-premium">
            {/* Placeholder for high-quality team photo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <div className="absolute inset-x-8 bottom-8 p-10 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Users className="size-12 mb-4 opacity-50" />
              <h3 className="text-2xl font-black mb-2">Join Our Hero Network</h3>
              <p className="text-white/80 font-medium mb-6">Become a part of the largest volunteer network in the country.</p>
              <Button asChild className="w-full h-14 rounded-2xl font-black bg-white text-primary hover:bg-zinc-100 shadow-none">
                <Link href="/register">
                  Apply as Volunteer
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center space-y-12">
          <h2 className="text-3xl font-black tracking-tight uppercase">Our Real World Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full">
            {[
              { value: "450K+", label: "Lives Saved" },
              { value: "12K+", label: "Verified Donors" },
              { value: "64", label: "Active Districts" },
              { value: "15Min", label: "Avg. Response" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-4xl md:text-6xl font-black text-primary tracking-tighter">{stat.value}</p>
                <p className="text-xs font-black uppercase text-muted-foreground opacity-60 ">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
