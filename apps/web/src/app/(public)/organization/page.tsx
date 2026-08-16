import AllOrganization from "@/components/modules/Organization/AllOrganization/AllOrganization";
import { getPublicLeadershipMembers } from "@/services/organization";

export default async function Page() {
  const leadershipRes = await getPublicLeadershipMembers({
    level: "EXECUTIVE",
    category: "COMMITTEE",
  });

  return (
    <AllOrganization initialLeadership={leadershipRes?.data ?? []} />
  );
}
