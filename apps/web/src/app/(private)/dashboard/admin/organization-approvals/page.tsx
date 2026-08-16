"use client";

import { Building2, Check, FileClock, ImageIcon, Newspaper, X } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAdminBlogsQuery, useUpdateBlogStatusMutation } from "@/redux/features/blogs/blogsApi";
import { useGetAdminEventsQuery, useUpdateEventApprovalMutation } from "@/redux/features/events/eventsApi";
import { useGetManagedGalleriesQuery, useUpdateGalleryApprovalMutation } from "@/redux/features/gallery/galleryApi";

type QueueItem = { id: string; title: string; organization: string };

function QueueSection({ title, icon: Icon, items, loading, error, reviewing, onReview }: {
  title: string;
  icon: typeof Newspaper;
  items: QueueItem[];
  loading: boolean;
  error: boolean;
  reviewing: boolean;
  onReview: (id: string, approved: boolean) => Promise<void>;
}) {
  return (
    <Card className="rounded-[2rem] border-border/50 shadow-none">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><h2 className="font-black uppercase tracking-tight">{title}</h2></div><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-600">{items.length} pending</span></div>
        {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>}
        {error && <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm font-semibold text-red-600">This approval queue could not be loaded.</div>}
        {!loading && !error && !items.length && <div className="rounded-2xl border border-dashed py-10 text-center text-sm font-semibold text-muted-foreground">No organization submissions awaiting review.</div>}
        <div className="space-y-3">
          {items.map((item) => <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-bold">{item.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3" />{item.organization}</p></div><div className="flex gap-2"><Button size="sm" disabled={reviewing} onClick={() => void onReview(item.id, true)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700"><Check className="mr-1 size-4" />Approve</Button><Button size="sm" disabled={reviewing} variant="destructive" onClick={() => void onReview(item.id, false)} className="rounded-xl"><X className="mr-1 size-4" />Reject</Button></div></div>)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganizationApprovalsPage() {
  const blogs = useGetAdminBlogsQuery({ limit: 200, status: "PENDING" });
  const events = useGetAdminEventsQuery({ limit: 200 });
  const galleries = useGetManagedGalleriesQuery({ limit: 200 });
  const [reviewBlog, blogReview] = useUpdateBlogStatusMutation();
  const [reviewEvent, eventReview] = useUpdateEventApprovalMutation();
  const [reviewGallery, galleryReview] = useUpdateGalleryApprovalMutation();

  const blogItems = (blogs.data?.data ?? []).filter((item) => item.organizationId && item.status === "PENDING").map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? "Organization" }));
  const eventItems = (events.data?.data ?? []).filter((item) => item.organizationId && item.approvalStatus === "PENDING").map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? "Organization" }));
  const galleryItems = (galleries.data?.data ?? []).filter((item) => item.organizationId && item.approvalStatus === "PENDING").map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? "Organization" }));

  const complete = (message: string) => toast.success(message);
  const fail = () => toast.error("The submission could not be reviewed.");

  return (
    <div className="space-y-8">
      <DashboardHeader variant="clinical" title="Organization Approvals" subtitle="Review organization-owned content before it becomes publicly visible." badge="Moderation Queue" />
      <div className="grid gap-6 xl:grid-cols-3">
        <QueueSection title="Blog submissions" icon={Newspaper} items={blogItems} loading={blogs.isLoading} error={blogs.isError} reviewing={blogReview.isLoading} onReview={async (id, approved) => { try { await reviewBlog({ id, status: approved ? "APPROVED" : "REJECTED" }).unwrap(); complete(`Blog ${approved ? "approved and published" : "rejected"}.`); } catch { fail(); } }} />
        <QueueSection title="Event submissions" icon={FileClock} items={eventItems} loading={events.isLoading} error={events.isError} reviewing={eventReview.isLoading} onReview={async (id, approved) => { try { await reviewEvent({ id, approvalStatus: approved ? "APPROVED" : "REJECTED" }).unwrap(); complete(`Event ${approved ? "approved and published" : "rejected"}.`); } catch { fail(); } }} />
        <QueueSection title="Gallery submissions" icon={ImageIcon} items={galleryItems} loading={galleries.isLoading} error={galleries.isError} reviewing={galleryReview.isLoading} onReview={async (id, approved) => { try { await reviewGallery({ id, approvalStatus: approved ? "APPROVED" : "REJECTED" }).unwrap(); complete(`Gallery ${approved ? "approved and published" : "rejected"}.`); } catch { fail(); } }} />
      </div>
    </div>
  );
}
