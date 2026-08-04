import AllOrganization from "@/components/modules/Organization/AllOrganization/AllOrganization";
import {
  getPublicLeadershipMembers,
} from "@/services/organization";
import { getPublicPosts } from "@/services/post";

export default async function Page() {
  const [leadershipRes, postsRes] = await Promise.all([
    getPublicLeadershipMembers({ level: "EXECUTIVE" }),
    getPublicPosts({ limit: 20, isWork: true, approvalStatus: "APPROVED" }),
  ]);

  return (
    <AllOrganization
      initialLeadership={leadershipRes?.data ?? []}
      initialPosts={postsRes?.data ?? []}
    />
  );
}
