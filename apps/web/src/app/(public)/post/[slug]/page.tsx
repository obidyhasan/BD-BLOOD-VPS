import PostDetail from "@/components/modules/Donor/Posts/PostDetail";
import { getPublicPost } from "@/services/post";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug: identifier } = await params;
  const result = await getPublicPost(identifier);
  if (result.status === "not-found") return notFoundMetadata("Post");
  if (result.status === "error") {
    return { title: "Post | BD Blood" };
  }

  return buildEntityMetadata({
    title: result.data.title,
    description: result.data.content,
    image: result.data.images?.[0],
    path: `/post/${result.data.slug ?? result.data.id}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: identifier } = await params;
  const result = await getPublicPost(identifier);

  return (
    <PostDetail
      identifier={identifier}
      initialPost={result.status === "success" ? result.data : null}
      initialStatus={result.status}
      initialError={result.status === "error" ? result.message : undefined}
    />
  );
}
