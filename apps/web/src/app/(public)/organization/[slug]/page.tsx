import PublicOrganizationProfile from "@/components/modules/Organization/PublicOrganizationProfile/PublicOrganizationProfile";
import {
  getOrganizationBySlug,
  getPublicOrganizationMembers,
} from "@/services/organization";
import { getPublicPosts } from "@/services/post";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const org = (await getOrganizationBySlug(slug))?.data;
  if (!org) return notFoundMetadata("Organization");

  return buildEntityMetadata({
    title: org.name,
    description: org.description || org.address,
    image: org.logo,
    path: `/organization/${slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const orgRes = await getOrganizationBySlug(slug);
  const orgId = orgRes?.data?.id;

  const [membersRes, postsRes] = orgId
    ? await Promise.all([
        getPublicOrganizationMembers(orgId),
        getPublicPosts({
          limit: 50,
          organizationId: orgId,
          isWork: true,
          approvalStatus: "APPROVED",
        }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <PublicOrganizationProfile
      slug={slug}
      initialOrganization={orgRes?.data ?? null}
      initialMembers={membersRes?.data ?? []}
      initialPosts={postsRes?.data ?? []}
    />
  );
}
