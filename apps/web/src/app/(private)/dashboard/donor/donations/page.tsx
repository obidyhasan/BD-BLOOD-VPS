"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Droplets, Calendar, TrendingUp, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { useGetMyDonationsQuery } from "@/redux/features/bloodDonations/bloodDonationsApi";
import { useGetMyAchievementsQuery } from "@/redux/features/achievements/achievementsApi";
import { format } from "date-fns";

export default function DonorDonationsPage() {
  const { data, isLoading } = useGetMyDonationsQuery();
  const { data: achievementsData } = useGetMyAchievementsQuery();
  const donations = data?.data ?? [];
  const achievements = achievementsData?.data ?? [];

  const totalUnits = donations.length;
  const CENTURION_GOAL = 25;
  const progressPct = Math.min((totalUnits / CENTURION_GOAL) * 100, 100);

  return (
    <div className="space-y-10">
      <DashboardHeader
        variant="clinical"
        title="Donation History"
        subtitle="A full list of all the times you have given blood to help others."
        badge="History"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-10">
        <div className="lg:col-span-3 space-y-6">
          {/* Loading skeleton */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse"
              />
            ))}

          {/* Empty state */}
          {!isLoading && donations.length === 0 && (
            <Card className="rounded-[2.5rem] border-dashed border-border/60 bg-transparent shadow-none p-16 text-center">
              <div className="size-20 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6 opacity-30">
                <Droplets className="size-10" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight opacity-40">
                No Donations Yet
              </h3>
              <p className="text-xs font-medium text-muted-foreground mt-2">
                Your donation history will appear here.
              </p>
            </Card>
          )}

          {/* Donation cards */}
          {!isLoading &&
            donations.map((dn, i) => (
              <motion.div
                key={dn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden hover:border-primary/20 transition-all bg-white dark:bg-zinc-950 group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      <div className="size-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center font-black group-hover:bg-primary/5 transition-colors">
                        <Droplets className="size-8 text-primary mb-1" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`rounded-full border-none font-black text-[8px] uppercase px-3 py-1 ${dn.verificationStatus === "VERIFIED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : dn.verificationStatus === "REJECTED"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-amber-500/10 text-amber-500"
                              }`}
                          >
                            {dn.verificationStatus}
                          </Badge>
                          <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase">
                            {dn.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight">
                          {dn.hospitalName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-6">
                          <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Calendar className="size-3.5" />
                            {format(new Date(dn.donationDate), "MMMM dd, yyyy")}
                          </p>
                          {dn.organization && (
                            <p className="text-xs font-bold text-muted-foreground uppercase">
                              {dn.organization.name}
                            </p>
                          )}
                        </div>
                        {dn.notes && (
                          <p className="text-[11px] text-muted-foreground opacity-60 ">
                            {dn.notes}
                          </p>
                        )}
                      </div>

                      <div className="md:text-right space-y-2 border-t md:border-t-0 md:border-l border-border/40 pt-6 md:pt-0 md:pl-8">
                        <p className="text-2xl font-black leading-none">
                          1 Unit
                        </p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase">
                          Impacted 3 Lives
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>

        {/* Sidebar: Lifetime impact */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 p-8">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">
              Lifetime Impact
            </h3>
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                    Total Units
                  </p>
                  <p className="text-3xl font-black">{totalUnits}</p>
                </div>
                <TrendingUp className="size-8 text-primary opacity-20" />
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                {totalUnits < CENTURION_GOAL
                  ? `You are ${CENTURION_GOAL - totalUnits} units away from the "Centurion Donor" platinum badge.`
                  : `You have earned the "Centurion Donor" platinum badge! 🎉`}
              </p>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-border/40 shadow-none bg-white dark:bg-zinc-950 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="size-5 text-amber-500" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Achievements
              </h3>
            </div>
            <div className="space-y-3">
              {achievements.length ? (
                achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-2xl border border-border/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">{achievement.title}</p>
                      <Badge variant="outline" className="text-[9px] font-black">
                        {achievement.unlocked ? "Unlocked" : achievement.thresholdValue}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-muted-foreground">
                  Verified donation milestones will appear here.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}