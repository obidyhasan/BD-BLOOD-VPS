"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BlogModal from "@/components/modules/Admin/Blogs/BlogModal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import {
  useGetAdminBlogsQuery,
  useUpdateBlogStatusMutation,
  useDeleteBlogMutation,
} from "@/redux/features/blogs/blogsApi";
import { format } from "date-fns";

const statusStyle = (s: string) =>
  s === "APPROVED"
    ? "bg-emerald-500/10 text-emerald-500"
    : s === "PENDING"
      ? "bg-amber-500/10 text-amber-500"
      : "bg-zinc-500/10 text-zinc-500";

const getBlogDate = (blog: { created_at?: string; createdAt?: string }) =>
  blog.created_at ?? blog.createdAt ?? "";

const formatBlogDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : format(date, "MMM dd, yyyy");
};

export default function AdminBlogsPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading } = useGetAdminBlogsQuery({ limit: 200 });
  const [updateBlogStatus] = useUpdateBlogStatusMutation();
  const [deleteBlog] = useDeleteBlogMutation();

  const blogs = data?.data ?? [];

  const filteredBlogs = useMemo(() => {
    let result = blogs.filter((b) => {
      const query = searchQuery.toLowerCase();
      const authorName = b.author?.fullName ?? "BD Blood";

      return (
        b.title.toLowerCase().includes(query) ||
        authorName.toLowerCase().includes(query)
      );
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(getBlogDate(a)).getTime() || 0;
      const dateB = new Date(getBlogDate(b)).getTime() || 0;
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [blogs, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(start, start + itemsPerPage);
  }, [filteredBlogs, currentPage]);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateBlogStatus({ id, status: "APPROVED" }).unwrap();
      toast.success("Article published successfully");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateBlogStatus({ id, status: "REJECTED" }).unwrap();
      toast.error("Article rejected");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBlog(deleteTarget).unwrap();
      toast.success("Article deleted permanently");
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Content Library"
          subtitle="Manage health guides, donor stories, and medical announcements."
          badge="Admin Editorial"
        />
        <BlogModal onSuccess={() => setCurrentPage(1)} />
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search titles or authors..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-bold"
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(v) => {
            setSortOrder(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-max min-w-48 py-7 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-xs uppercase px-6">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value="newest" className="font-bold">
              Newest First
            </SelectItem>
            <SelectItem value="oldest" className="font-bold">
              Oldest First
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse"
            />
          ))}

        {!isLoading && paginatedBlogs.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
            <BookOpen className="size-16 mb-4 stroke-1" />
            <p className="text-xl font-black uppercase">No Blogs Found</p>
            <p className="text-xs font-bold mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}

        {!isLoading &&
          paginatedBlogs.map((blog, i) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-[3rem] shadow-none border-border/40 overflow-hidden hover:border-primary/20 hover:shadow-premium transition-all duration-500 group flex flex-col h-full">
                {/* Cover Image */}
                <div className="relative h-64 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {blog.coverImage ? (
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="size-16 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-4 left-4">
                    <Badge
                      className={`px-3 py-1 rounded-full font-black text-[9px] uppercase  border-none ${statusStyle(blog.status)}`}
                    >
                      {blog.status}
                    </Badge>
                  </div>
                </div>

                <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4 mt-5">
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpen className="size-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase  text-muted-foreground opacity-60">
                        Insight Registry
                      </span>
                    </div>

                    <Link href={`/blog/${blog.slug || blog.id}`}>
                      <h3 className="font-black text-xl tracking-tighter group-hover:text-primary transition-colors leading-tight uppercase line-clamp-2">
                        {blog.title}
                      </h3>
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-3.5 text-primary opacity-60" />
                        <span className="text-[10px] font-black uppercase ">
                          {blog.author?.fullName ?? "BD Blood"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5 opacity-40" />
                        <span className="text-[10px] font-bold opacity-40 uppercase">
                          {formatBlogDate(getBlogDate(blog))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black tracking-tighter text-foreground">
                        {(blog.reads || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase opacity-40 ">
                        Reads
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <BlogModal
                        blog={blog}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-10 rounded-xl border-border/40 hover:bg-zinc-950 hover:text-white transition-all shadow-sm"
                          >
                            <Edit3 className="size-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-10 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-black"
                        onClick={() => setDeleteTarget(blog.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>

                      {blog.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            className="size-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
                            onClick={(e) => handleApprove(blog.id, e)}
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-10 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-black"
                            onClick={(e) => handleReject(blog.id, e)}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredBlogs.length} articles
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              <ChevronLeft className="size-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              Next
              <ChevronRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                Are you sure you want to permanently remove this article? This
                action is irreversible.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40 shadow-none"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={confirmDelete}
                className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 transition-all"
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
