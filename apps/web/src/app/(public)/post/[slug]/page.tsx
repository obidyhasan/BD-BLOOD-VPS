import PostDetail from "@/components/modules/Donor/Posts/PostDetail";
import { getPublicPostBySlug } from "@/services/post";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const post = (await getPublicPostBySlug(slug))?.data;
  if (!post) return notFoundMetadata("Post");

  return buildEntityMetadata({
    title: post.title,
    description: post.content,
    image: post.images?.[0],
    path: `/post/${post.slug ?? slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const postRes = await getPublicPostBySlug(slug);

  return (
    <PostDetail slug={slug} initialPost={postRes?.data ?? null} />
  );
}
