"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import CommitteeCard from "@/components/modules/Organization/AllOrganization/CommitteeCard";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";
import { GEO_ORGANIZATION_TYPES } from "@/lib/organizationGeo";
import type { Organization } from "@/redux/features/organizations/organizationsApi";

type CommitteeSectionProps = {
  initialOrganizations?: Organization[];
};

const CommitteeSection = ({ initialOrganizations }: CommitteeSectionProps) => {
  const divisionOrgParams = {
    limit: 8,
    verificationStatus: "VERIFIED",
    organizationStatus: "ACTIVE",
    type: GEO_ORGANIZATION_TYPES.division,
  };

  const { data, isLoading } = useGetAllOrganizationsQuery(divisionOrgParams, {
    skip: !!initialOrganizations?.length,
  });

  const organizations = initialOrganizations ?? data?.data ?? [];
  const loading = !initialOrganizations?.length && isLoading;

  return (
    <section
      id="committees"
      className="py-10 md:py-16 bg-white dark:bg-zinc-950"
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Top Organizations"
          subtitle="Division-level blood coordination organizations across all 8 divisions of Bangladesh."
          button={{
            text: "All Organizations",
            href: "/organization",
            variant: "outline",
          }}
        />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-64 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-dashed border-border/40"
              />
            ))
            : organizations.map((org) => (
              <CommitteeCard
                key={org.id}
                orgId={org.id}
                name={org.name}
                logo={org.logo}
                location={org.district?.name ?? org.address}
                members={org._count?.members ?? 0}
                description={org.description}
              />
            ))}
          {!loading && organizations.length === 0 && (
            <div className="col-span-full py-24 text-center border border-dashed rounded-[3rem] border-border/40">
              <p className="text-xl font-black uppercase tracking-tighter opacity-20 ">
                No division organizations found.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommitteeSection;
