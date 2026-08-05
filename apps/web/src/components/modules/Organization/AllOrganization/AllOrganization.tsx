"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import TeamCard from "@/components/modules/Home/OurTeam/TeamCard";
import OrganizationCard from "./OrganizationCard";
import { Filter, Globe, Newspaper, Network, Users } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import LocationSelector from "@/components/shared/LocationSelector/LocationSelector";
import {
  useGetAllOrganizationsQuery,
  useGetOrganizationTreeQuery,
  useLazyGetCanonicalOrganizationByUpazilaQuery,
  useGetPublicLeadershipMembersQuery,
} from "@/redux/features/organizations/organizationsApi";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { buildLocationOrgQueryParams } from "@/lib/organizationGeo";

import type {
  Organization,
  OrganizationTreeNode,
} from "@/redux/features/organizations/organizationsApi";
import type { Post as ApiPost } from "@/redux/features/posts/postsApi";

type AllOrganizationProps = {
  initialLeadership?: unknown[];
  initialPosts?: ApiPost[];
};

const AllOrganization = ({
  initialLeadership,
  initialPosts,
}: AllOrganizationProps) => {
  const router = useRouter();
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");

  const orgQueryParams = useMemo(
    () =>
      buildLocationOrgQueryParams({
        divisionId,
        districtId,
        upazilaId,
        limit: upazilaId || districtId || divisionId ? 1 : 8,
      }),
    [divisionId, districtId, upazilaId],
  );

  const { data, isLoading, isFetching } = useGetAllOrganizationsQuery(
    orgQueryParams,
  );

  // Leadership tabs are scoped to the selected Division/District (Central,
  // i.e. no selection, still works — the query just omits divisionId and
  // districtId, which the backend treats as a request for national/central
  // leadership members). Upazila selection doesn't scope these queries at
  // all: picking an upazila redirects straight to that upazila's public
  // organization profile instead (see handleUpazilaSelect below).
  const leadershipScope = useMemo(
    () => ({ divisionId: divisionId || undefined, districtId: districtId || undefined }),
    [divisionId, districtId],
  );

  const { data: committeeData, isLoading: committeeLoading } =
    useGetPublicLeadershipMembersQuery(
      { level: "EXECUTIVE", ...leadershipScope },
      { skip: !!initialLeadership?.length && !divisionId && !districtId },
    );
  const { data: advisorData, isLoading: advisorLoading } =
    useGetPublicLeadershipMembersQuery({ level: "MANAGEMENT", ...leadershipScope });

  const { data: postsData } = useGetPublicPostsQuery(
    {
      limit: 10,
      postType: "ANNOUNCEMENT",
      approvalStatus: "APPROVED",
    },
    { skip: !!initialPosts?.length },
  );

  const { data: treeData, isLoading: treeLoading } =
    useGetOrganizationTreeQuery();
  const [fetchOrgForUpazila] = useLazyGetCanonicalOrganizationByUpazilaQuery();

  const handleUpazilaSelect = useCallback(
    async (selectedUpazilaId: string) => {
      if (!selectedUpazilaId) return;
      try {
        const res = await fetchOrgForUpazila(selectedUpazilaId).unwrap();
        const org = res?.data;
        if (org?.id) {
          router.push(`/organization/${org.id}`);
        }
      } catch {
        // No verified organization found for this upazila yet — stay on
        // the directory page rather than navigating to a dead end.
      }
    },
    [fetchOrgForUpazila, router],
  );

  const orgLoading = isLoading || isFetching;
  const organizations = useMemo(() => data?.data ?? [], [data?.data]);

  const organizationNotices = useMemo(
    () =>
      (initialPosts ?? postsData?.data ?? []).map((p) => ({
        type: p.postType,
        title: p.title,
      })),
    [initialPosts, postsData],
  );

  const regionalPartners = useMemo(
    () =>
      organizations.slice(0, 4).map((o) => ({
        id: o.id,
        name: o.name,
        location: o.district?.name ?? o.address,
      })),
    [organizations],
  );

  const latestNotice = organizationNotices[0];

  const emptyMessage = divisionId || districtId || upazilaId
    ? "No verified organization found for this location."
    : "No division organizations found.";

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<Globe className="size-3.5" />}
        badgeText="All Organizations"
        titleBase="Blood"
        titleSpan="Organizations"
        titleSuffix="Directory"
        description="Find verified blood donation organizations by division, district, and upazila across Bangladesh."
      />

      <div className="max-w-7xl mx-auto px-6">
        <section className="mb-10 rounded-[2.5rem] border border-border/40 bg-zinc-50/60 p-6 dark:bg-zinc-900/30 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Network className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Canonical Organization Hierarchy</h2>
              <p className="text-xs font-medium text-muted-foreground">
                Central, Division, District, and Upazila organizations with donors and governance kept separate.
              </p>
            </div>
          </div>
          {treeLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ) : (treeData?.data ?? []).length ? (
            <div className="space-y-3">
              {(treeData?.data ?? []).map((node) => (
                <HierarchyNode key={node.id} node={node} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-8 text-center text-sm font-bold text-muted-foreground">
              Canonical hierarchy is not configured yet.
            </p>
          )}
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-8">
            <Tabs defaultValue="committee" className="w-full">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                <TabsList className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl py-7 px-2 h-14 w-full md:w-auto">
                  <TabsTrigger value="committee" className="rounded-md px-8 py-5 h-full font-bold text-md tracking-wider">Committee</TabsTrigger>
                  <TabsTrigger value="advisor" className="rounded-md px-8 py-5 h-full font-bold text-md tracking-wider">Advisor</TabsTrigger>
                </TabsList>

                <LocationSelector
                  divisionId={divisionId}
                  setDivisionId={setDivisionId}
                  districtId={districtId}
                  setDistrictId={setDistrictId}
                  upazilaId={upazilaId}
                  setUpazilaId={setUpazilaId}
                  onUpazilaSelect={handleUpazilaSelect}
                />
              </div>

              <div className="w-full h-64 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 flex items-center justify-center relative overflow-hidden group">
                <Carousel className="w-full h-full">
                  <CarouselContent className="w-full h-full">
                    {organizationNotices.map((notice, i) => (
                      <CarouselItem key={i} className="flex flex-col items-center justify-center text-center h-64">
                        <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">{notice.type}</span>
                        <h2 className="text-3xl font-black tracking-tight text-foreground line-clamp-2">{notice.title}</h2>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>

              <div className="space-y-8 pt-8">
                <div className="grid grid-cols-1 gap-8">
                  {orgLoading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-48 rounded-[3rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-dashed border-border/40"
                      />
                    ))}
                  {!orgLoading &&
                    organizations.map((org: Organization) => (
                      <OrganizationCard
                        key={org.id}
                        orgId={org.id}
                        name={org.name}
                        location={org.district?.name ?? org.address}
                        members={String(org._count?.members ?? 0)}
                        logo={org.logo}
                        type={org.type}
                      />
                    ))}
                  {organizations.length === 0 && !orgLoading && (
                    <div className="py-24 text-center border border-dashed rounded-[3rem] border-border/40">
                      <p className="text-xl font-black uppercase tracking-tighter opacity-20 ">{emptyMessage}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end justify-between px-2 mt-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">
                    Top <span className="text-primary">Members</span>
                  </h3>
                  <p className="text-muted-foreground text-xs font-bold uppercase">Main coordinating headquarters</p>
                </div>
              </div>

              <div className="mt-6">
                <TabsContent value="committee" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {committeeLoading &&
                      Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-64 rounded-[3rem] bg-zinc-100 animate-pulse" />
                      ))}
                    {!committeeLoading &&
                      (committeeData?.data ?? initialLeadership ?? []).map((member) => (
                        <TeamCard
                          key={(member as { id: string }).id}
                          name={(member as { donor: { fullName: string } }).donor.fullName}
                          position={(member as { position: { positionName: string } }).position.positionName}
                          image={(member as { donor: { profilePhoto?: string } }).donor.profilePhoto}
                          slug={(member as { donor: { id: string } }).donor.id}
                        />
                      ))}
                    {!committeeLoading &&
                      (committeeData?.data ?? initialLeadership ?? []).length === 0 && (
                        <p className="col-span-full text-center text-sm font-bold text-muted-foreground opacity-50 py-12">
                          No committee members listed yet.
                        </p>
                      )}
                  </div>
                </TabsContent>
                <TabsContent value="advisor" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {advisorLoading &&
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-64 rounded-[3rem] bg-zinc-100 animate-pulse" />
                      ))}
                    {!advisorLoading &&
                      (advisorData?.data ?? []).map((member) => (
                        <TeamCard
                          key={member.id}
                          name={member.donor.fullName}
                          position={member.position.positionName}
                          image={member.donor.profilePhoto}
                          slug={member.donor.id}
                        />
                      ))}
                    {!advisorLoading && (advisorData?.data ?? []).length === 0 && (
                      <p className="col-span-full text-center text-sm font-bold text-muted-foreground opacity-50 py-12">
                        No advisors listed yet.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="lg:col-span-3 ">
            <div className="w-full lg:sticky lg:top-32 space-y-6">
              <div className="md:col-span-4 h-64 rounded-[2.5rem] bg-zinc-900 dark:bg-zinc-800 p-8 flex flex-col justify-between group overflow-hidden relative">
                <Newspaper className="absolute -top-4 -right-4 size-32 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <p className="text-primary text-[10px] font-black uppercase  mb-2">Notice Board</p>
                  <h3 className="text-white font-black text-xl leading-tight line-clamp-3">
                    {latestNotice?.title ?? "No active notices at this time."}
                  </h3>
                </div>
                <Link href="/post" className="relative w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase  transition-all text-center block">
                  View All Notices
                </Link>
              </div>

              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-zinc-900 dark:bg-zinc-800 text-white space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--color-primary),transparent_70%)] opacity-20" />
                  <h4 className="font-black text-xl relative">Regional Partners</h4>
                  <div className="space-y-4 relative">
                    {regionalPartners.map((partner) => (
                      <Link key={partner.id} href={`/organization/${partner.id}`} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <div className="size-10 rounded-xl bg-primary/20 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase">{partner.name}</p>
                          <p className="text-[10px] text-white/60 font-bold">{partner.location}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] border border-dashed border-border/50 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground">
                    <Filter className="size-6" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground line-clamp-2">Want to list your medical? Reach out to us.</p>
                  <button className="text-primary text-xs font-black uppercase  hover:underline">Apply Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function HierarchyNode({
  node,
  depth = 0,
}: {
  node: OrganizationTreeNode;
  depth?: number;
}) {
  return (
    <div style={{ marginLeft: Math.min(depth, 3) * 16 }}>
      <Link
        href={`/organization/${node.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background px-4 py-3 transition-colors hover:border-primary/30"
      >
        <div>
          <span className="text-[9px] font-black uppercase text-primary">{node.level}</span>
          <p className="text-sm font-black">{node.name}</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" /> {node._count.donorAffiliations} donors
          </span>
          <span>{node._count.members} governance</span>
        </div>
      </Link>
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-border/50 pl-2">
          {node.children.map((child) => (
            <HierarchyNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default AllOrganization;

