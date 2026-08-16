"use client";

import BlogModal from "@/components/modules/Admin/Blogs/BlogModal";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import {
  useDeleteBlogMutation,
  useGetManagedBlogsQuery,
} from "@/redux/features/blogs/blogsApi";
import { Edit3, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationBlogsPage() {
  const { organizationId } = useOrganizationDashboardContext();
  const { data, isLoading } = useGetManagedBlogsQuery(
    { organizationId, limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    { skip: !organizationId },
  );
  const [deleteBlog] = useDeleteBlogMutation();

  const remove = async (id: string) => {
    try {
      await deleteBlog(id).unwrap();
      toast.success("Article removed");
    } catch {
      toast.error("Unable to remove article");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardHeader
          variant="clinical"
          title="Organization Blogs"
          subtitle="Create local stories and announcements for Admin review."
          badge="Editorial"
        />
        <BlogModal organizationId={organizationId || undefined} />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading articles…</p>
      ) : !data?.data.length ? (
        <div className="rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 size-10" /> No articles yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.data.map((blog) => (
            <article key={blog.id} className="space-y-4 rounded-3xl border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black leading-tight">{blog.title}</h2>
                <Badge variant="outline">{blog.status}</Badge>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{blog.content}</p>
              <div className="flex gap-2">
                <BlogModal
                  blog={blog}
                  organizationId={organizationId}
                  trigger={<Button size="sm" variant="outline"><Edit3 className="mr-2 size-4" /> Edit</Button>}
                />
                <Button size="sm" variant="destructive" onClick={() => void remove(blog.id)}>
                  <Trash2 className="mr-2 size-4" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
