import OrganizationPosts from "@/components/modules/Organization/OrganizationPosts/OrganizationPosts";
import { getOrganizationBySlug } from "@/services/organization";
import { getPublicPosts } from "@/services/post";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const orgRes = await getOrganizationBySlug(slug);
  const orgId = orgRes?.data?.id;

  const postsRes = orgId
    ? await getPublicPosts({
        limit: 100,
        organizationId: orgId,
        isWork: true,
        approvalStatus: "APPROVED",
      })
    : { data: [] };

  return (
    <OrganizationPosts
      slug={slug}
      initialOrganization={orgRes?.data ?? null}
      initialPosts={postsRes?.data ?? []}
    />
  );
}
