"use client";

import { AlertCircle, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TeamCard from "@/components/modules/Home/OurTeam/TeamCard";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import LocationSelector from "@/components/shared/LocationSelector/LocationSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type OrganizationMember,
  useGetPublicLeadershipMembersQuery,
  useLazyGetCanonicalOrganizationByUpazilaQuery,
} from "@/redux/features/organizations/organizationsApi";

type LeadershipTab = "committee" | "advisors";

type AllOrganizationProps = {
  initialLeadership?: OrganizationMember[];
};

function MemberGrid({ members, loading }: { members: OrganizationMember[]; loading: boolean }) {
  if (loading) {
    return Array.from({ length: 11 }).map((_, index) => (
      <div key={index} className="h-64 animate-pulse rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900" />
    ));
  }
  if (!members.length) {
    return (
      <div className="col-span-full rounded-[2.5rem] border border-dashed border-border/60 py-20 text-center">
        <Users className="mx-auto mb-4 size-10 text-muted-foreground/30" />
        <p className="font-black uppercase tracking-tight text-muted-foreground">No configured members for this scope</p>
      </div>
    );
  }
  return members.map((member) => (
    <TeamCard
      key={member.id}
      name={member.donor.fullName}
      position={member.position.positionName}
      image={member.donor.profilePhoto}
      slug={member.donor.slug || member.donor.id}
    />
  ));
}

export default function AllOrganization({ initialLeadership = [] }: AllOrganizationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<LeadershipTab>(searchParams.get("tab") === "advisors" ? "advisors" : "committee");
  const [divisionId, setDivisionId] = useState(searchParams.get("divisionId") ?? "");
  const [districtId, setDistrictId] = useState(searchParams.get("districtId") ?? "");
  const [upazilaId, setUpazilaId] = useState(searchParams.get("upazilaId") ?? "");
  const [redirectError, setRedirectError] = useState("");

  useEffect(() => {
    const next = new URLSearchParams();
    if (divisionId) next.set("divisionId", divisionId);
    if (districtId) next.set("districtId", districtId);
    if (upazilaId) next.set("upazilaId", upazilaId);
    if (activeTab === "advisors") next.set("tab", activeTab);
    const query = next.toString();
    if (query !== searchParams.toString()) router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeTab, districtId, divisionId, pathname, router, searchParams, upazilaId]);

  const scope = useMemo(
    () => ({ divisionId: divisionId || undefined, districtId: districtId || undefined }),
    [divisionId, districtId],
  );
  const rootCommitteeHydrated = initialLeadership.length > 0 && !divisionId && !districtId;
  const committee = useGetPublicLeadershipMembersQuery(
    { level: "EXECUTIVE", category: "COMMITTEE", ...scope },
    { skip: rootCommitteeHydrated },
  );
  const advisors = useGetPublicLeadershipMembersQuery({ level: "MANAGEMENT", category: "ADVISOR", ...scope });
  const committeeMembers = rootCommitteeHydrated ? initialLeadership : committee.data?.data ?? [];
  const advisorMembers = advisors.data?.data ?? [];
  const current = activeTab === "committee" ? committee : advisors;
  const [fetchOrganization, organizationLookup] = useLazyGetCanonicalOrganizationByUpazilaQuery();

  const selectUpazila = useCallback(async (selectedId: string) => {
    if (!selectedId) return;
    setRedirectError("");
    try {
      const result = await fetchOrganization(selectedId).unwrap();
      if (!result.data?.id) throw new Error("Missing canonical organization");
      router.push(`/organization/${result.data.id}`);
    } catch {
      setUpazilaId("");
      setRedirectError("The selected Upazila does not have an active public organization profile.");
    }
  }, [fetchOrganization, router]);

  const context = districtId ? "District" : divisionId ? "Division" : "National";
  const visibleMembers = activeTab === "committee" ? committeeMembers : advisorMembers;

  return (
    <main className="min-h-screen bg-white pb-16 dark:bg-zinc-950">
      <PageHeader
        icon={<Users className="size-3.5" />}
        badgeText="Leadership Directory"
        titleBase="BD Blood"
        titleSpan="Committee"
        titleSuffix="& Advisors"
        description="Explore national, division, and district leadership. Select an Upazila to open its organization profile."
      />

      <section className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeadershipTab)}>
          <div className="flex flex-col gap-5 rounded-[2rem] border border-border/50 bg-zinc-50/70 p-4 md:flex-row md:items-center md:justify-between md:p-6 dark:bg-zinc-900/50">
            <TabsList className="h-12 w-full rounded-xl md:w-auto">
              <TabsTrigger value="committee" className="h-10 flex-1 rounded-lg px-7 font-bold md:flex-none">Committee</TabsTrigger>
              <TabsTrigger value="advisors" className="h-10 flex-1 rounded-lg px-7 font-bold md:flex-none">Advisors</TabsTrigger>
            </TabsList>
            <LocationSelector
              divisionId={divisionId}
              setDivisionId={(value) => { setDivisionId(value); setDistrictId(""); setUpazilaId(""); setRedirectError(""); }}
              districtId={districtId}
              setDistrictId={(value) => { setDistrictId(value); setUpazilaId(""); setRedirectError(""); }}
              upazilaId={upazilaId}
              setUpazilaId={setUpazilaId}
              onUpazilaSelect={selectUpazila}
            />
          </div>

          {redirectError && (
            <div role="alert" className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-semibold text-red-600">
              <AlertCircle className="size-5 shrink-0" /> {redirectError}
            </div>
          )}

          <div className="my-8 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{context} leadership</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{activeTab === "committee" ? "Committee" : "Advisors"}</h2>
            </div>
            <p className="text-sm font-bold text-muted-foreground">{visibleMembers.length} of 11 configured</p>
          </div>

          {current.isError ? (
            <div className="rounded-[2.5rem] border border-dashed border-red-500/30 py-20 text-center">
              <AlertCircle className="mx-auto mb-4 size-10 text-red-500" />
              <p className="mb-5 font-bold">Leadership data could not be loaded.</p>
              <Button variant="outline" onClick={() => void current.refetch()}><RefreshCw className="mr-2 size-4" /> Try again</Button>
            </div>
          ) : (
            <>
              <TabsContent value="committee" className="mt-0">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  <MemberGrid members={committeeMembers} loading={!rootCommitteeHydrated && (committee.isLoading || committee.isFetching)} />
                </div>
              </TabsContent>
              <TabsContent value="advisors" className="mt-0">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  <MemberGrid members={advisorMembers} loading={advisors.isLoading || advisors.isFetching} />
                </div>
              </TabsContent>
            </>
          )}

          {organizationLookup.isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" aria-live="polite">
              <div className="rounded-2xl border bg-card px-6 py-4 font-bold shadow-xl">Opening organization profile…</div>
            </div>
          )}
        </Tabs>
      </section>
    </main>
  );
}
