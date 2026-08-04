import BlogsPage from "@/components/modules/Blog/BlogsPage";
import { getPublicBlogs } from "@/services/blog";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const page = Number(
    Array.isArray(params.page) ? params.page[0] : params.page || 1,
  );
  const searchTerm = Array.isArray(params.search)
    ? params.search[0]
    : params.search;
  const sortOrder = Array.isArray(params.sort)
    ? params.sort[0]
    : params.sort || "newest";

  const initialData = await getPublicBlogs({
    page,
    limit: 12,
    searchTerm: searchTerm || undefined,
    sortBy: "created_at",
    sortOrder: sortOrder === "newest" ? "desc" : "asc",
  });

  return <BlogsPage initialData={initialData} />;
}
