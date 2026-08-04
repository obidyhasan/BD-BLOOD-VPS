import { Share2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import PostFeed from "@/components/modules/Post/PostFeed";
import { getPublicPosts } from "@/services/post";

export default async function DonorSocialPage() {
  const postsRes = await getPublicPosts({
    limit: 100,
    approvalStatus: "APPROVED",
  });

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/30">
      <PageHeader
        icon={<Share2 className="size-3.5" />}
        badgeText="Donor Social Network"
        titleBase="Our"
        titleSpan="Community"
        titleSuffix="Feed"
        description="Connect with fellow donors across the nation. Browse recent activities, urgent blood requests, and shared experiences from the BD BLOOD family."
      />

      <PostFeed initialData={postsRes} />
    </div>
  );
}
