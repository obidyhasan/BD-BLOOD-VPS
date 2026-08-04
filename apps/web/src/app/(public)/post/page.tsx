import PostFeed from "@/components/modules/Post/PostFeed";
import { getPublicPosts } from "@/services/post";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const searchTerm = Array.isArray(params.search)
    ? params.search[0]
    : params.search;

  const initialData = await getPublicPosts({
    limit: 100,
    approvalStatus: "APPROVED",
    searchTerm: searchTerm || undefined,
  });

  return <PostFeed initialData={initialData} />;
}
