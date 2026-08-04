import BlogDetailsPage from "@/components/modules/Blog/BlogDetailsPage";
import {
  getPublicBlogById,
  getPublicBlogBySlug,
  getPublicBlogs,
} from "@/services/blog";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const blogRes = isUuid(slug)
    ? await getPublicBlogById(slug)
    : await getPublicBlogBySlug(slug);
  const blog = blogRes?.data;
  if (!blog) return notFoundMetadata("Blog post");

  return buildEntityMetadata({
    title: blog.title,
    description: blog.content,
    image: blog.coverImage,
    path: `/blog/${blog.slug ?? slug}`,
  });
};

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const [blogRes, relatedRes] = await Promise.all([
    isUuid(slug) ? getPublicBlogById(slug) : getPublicBlogBySlug(slug),
    getPublicBlogs({ limit: 20 }),
  ]);

  return (
    <BlogDetailsPage
      slug={slug}
      initialBlog={blogRes?.data ?? null}
      initialRelated={relatedRes?.data ?? []}
    />
  );
};

export default Page;
