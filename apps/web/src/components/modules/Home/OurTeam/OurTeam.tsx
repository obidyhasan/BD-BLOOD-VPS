"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import TeamCard from "./TeamCard";
import { motion } from "motion/react";
import type { OrganizationMember } from "@/redux/features/organizations/organizationsApi";

type OurTeamProps = {
  initialMembers?: OrganizationMember[];
};

export default function OurTeam({ initialMembers = [] }: OurTeamProps) {
  const members = initialMembers;

  return (
    <section id="team" className="py-10 md:py-16 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Who's Behind"
          subtitle="The top appointed members coordinating the BD Blood network."
        />

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <p className="text-sm font-black uppercase  ">
              National committee roster pending
            </p>
            <p className="text-[10px] mt-2 font-bold ">
              Appointed members will appear here after publication.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.slice(0, 11).map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <TeamCard
                  name={member.donor.fullName}
                  position={member.position.positionName}
                  image={member.donor.profilePhoto}
                  slug={member.donor.slug ?? member.donor.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
