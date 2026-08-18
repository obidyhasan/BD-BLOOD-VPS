import PostFeed from "@/components/modules/Post/PostFeed";
import { getPublicPosts } from "@/services/post";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const scope = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const searchTerm = Array.isArray(params.search)
    ? params.search[0]
    : params.search;

  const initialData = await getPublicPosts({
    limit: 100,
    approvalStatus: "APPROVED",
    postScope:
      scope === "organization" || scope === "donor" ? scope : undefined,
    searchTerm: searchTerm || undefined,
  });

  return <PostFeed initialData={initialData} />;
}
