"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import TeamCard from "./TeamCard";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useGetPublicDonorsQuery } from "@/redux/features/donors/donorsApi";
import type { Donor } from "@/redux/features/donors/donorsApi";

type OurTeamProps = {
  initialMembers?: Donor[];
};

export default function OurTeam({ initialMembers }: OurTeamProps) {
  const { data, isLoading } = useGetPublicDonorsQuery(
    {
      page: 1,
      limit: 8,
      availabilityStatus: "AVAILABLE",
    },
    { skip: !!initialMembers?.length },
  );

  const members = initialMembers ?? data?.data ?? [];
  const loading = !initialMembers?.length && isLoading;

  return (
    <section id="team" className="py-10 md:py-16 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="The Hearts Behind"
          subtitle="Verified donors and coordinators from the BD Blood network."
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <p className="text-sm font-black uppercase  ">
              Onboarding verified donors...
            </p>
            <p className="text-[10px] mt-2 font-bold ">
              Check back soon to meet the network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <TeamCard
                  name={member.fullName}
                  position={`${member.bloodGroup?.groupName ?? "Donor"} • ${member.district?.name ?? "Bangladesh"}`}
                  image={member.profilePhoto}
                  slug={member.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
