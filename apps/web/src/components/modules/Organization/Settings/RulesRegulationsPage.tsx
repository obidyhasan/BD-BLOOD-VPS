"use client";

import React, { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Scale,
  Search,
  Clock,
  BookOpen,
  ShieldAlert,
  Lock,
  Users,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGetAllPoliciesQuery } from "@/redux/features/policies/policiesApi";
import { mapPolicyToUI } from "@/lib/policy";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, LucideIcon> = {
  Safety: ShieldAlert,
  Admin: Scale,
  Donor: Users,
  Privacy: Lock,
};

const categoryColors: Record<string, string> = {
  Safety: "text-red-500 bg-red-500/5 border-red-500/10",
  Admin: "text-amber-500 bg-amber-500/5 border-amber-500/10",
  Donor: "text-blue-500 bg-blue-500/5 border-blue-500/10",
  Privacy: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
};

const RulesRegulationsPage = () => {
  const { data: policiesData } = useGetAllPoliciesQuery({ active: true });
  const policies = useMemo(
    () => (policiesData?.data ?? []).map(mapPolicyToUI),
    [policiesData],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Safety", "Admin", "Donor", "Privacy"];

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory && p.active;
    });
  }, [policies, searchQuery, activeCategory]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <DashboardHeader
          variant="clinical"
          title="Organization Guidance"
          subtitle="Read and follow the rules to keep our blood bank safe and helpful for everyone."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-28">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a rule..."
              className="h-14 pl-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-border/40 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
            />
          </div>

          <div className="p-2 rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-border/40 border-dashed space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between px-6 h-14 rounded-2xl font-black text-xs uppercase transition-all group",
                  activeCategory === cat
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xl"
                    : "text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  {cat === "All" ? (
                    <BookOpen className="size-4" />
                  ) : (
                    React.createElement(categoryIcons[cat] || BookOpen, {
                      className: "size-4",
                    })
                  )}
                  {cat}
                </div>
                <ChevronRight
                  className={cn(
                    "size-3 transition-transform",
                    activeCategory === cat
                      ? "translate-x-0"
                      : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Rules Content */}
        <div className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPolicies.map((policy, index) => {
                const Icon = categoryIcons[policy.category] || BookOpen;
                return (
                  <motion.div
                    layout
                    key={policy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-card hover:border-primary/40 transition-all duration-500 group relative flex flex-col h-full border-dashed group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardContent className="p-8 space-y-6 flex-1 flex flex-col relative z-10">
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "size-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-current/10 ",
                              categoryColors[policy.category],
                            )}
                          >
                            <Icon className="size-7" />
                          </div>
                          <div className="text-right">
                            <Badge
                              className={cn(
                                "mt-1 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase  border",
                                categoryColors[policy.category],
                              )}
                            >
                              {policy.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          <h3 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none">
                            {policy.title}
                          </h3>
                          <p className="text-sm font-bold text-muted-foreground leading-relaxed opacity-60">
                            {policy.description}
                          </p>
                        </div>

                        <div className="pt-6 mt-auto flex items-center justify-between border-t border-border/20 border-dashed">
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground opacity-40">
                            <Clock className="size-3" />
                            Updated {policy.lastUpdated}
                          </div>
                          <ArrowRight className="size-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {filteredPolicies.length === 0 && (
                <div className="col-span-full h-80 rounded-[4rem] border-2 border-dashed border-border/20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <BookOpen className="size-16" />
                  <div className="space-y-1">
                    <p className="font-black text-lg uppercase tracking-tighter">
                      No rules found
                    </p>
                    <p className="text-xs font-bold text-muted-foreground max-w-xs">
                      We couldn&apos;t find any rules matching your search. Try
                      another word.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RulesRegulationsPage;
