"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Trash2,
  Eye,
  Images,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import UploadMediaModal from "@/components/modules/Admin/Gallery/UploadMediaModal";
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
import {
  useGetManagedGalleriesQuery,
  useDeleteGalleryMutation,
} from "@/redux/features/gallery/galleryApi";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import { format } from "date-fns";

import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";

const catStyle = (c: string) =>
  c === "Event" || c === "Blood Drive" || c === "Campaign"
    ? "bg-red-500/10 text-red-500"
    : c === "Medical" || c === "Awareness"
      ? "bg-primary/10 text-primary"
      : c === "Volunteer" || c === "Training"
        ? "bg-blue-500/10 text-blue-500"
        : "bg-zinc-500/10 text-zinc-500";

export default function OrganizationGalleryPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { organizationId: orgId } = useOrganizationDashboardContext();

  const { data, isLoading } = useGetManagedGalleriesQuery(
    { limit: 200, organizationId: orgId ?? "" },
    { skip: !orgId },
  );
  const [deleteGallery] = useDeleteGalleryMutation();

  const assets = data?.data ?? [];

  const filteredAssets = useMemo(() => {
    let result = assets.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [assets, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(start, start + itemsPerPage);
  }, [filteredAssets, currentPage]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGallery(deleteTarget).unwrap();
      toast.success("Gallery item removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Media Gallery"
          subtitle="Manage photos from blood drives, campaigns, and medical events."
          badge="Media Vault"
        />
        <div className="flex gap-4">
          <div className="py-1 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Images className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Total Assets
              </p>
              <p className="text-xl font-black  tracking-tighter">
                {filteredAssets.length}
              </p>
            </div>
          </div>
          <UploadMediaModal
            onSuccess={() => setCurrentPage(1)}
            organizationId={orgId ?? undefined}
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search title or category..."
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

      {/* Gallery Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse"
            />
          ))}

        {!isLoading && paginatedAssets.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
            <ImageIcon className="size-16 mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">
              No Assets Found
            </p>
          </div>
        )}

        {!isLoading &&
          paginatedAssets.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="group relative"
            >
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-border/40 bg-zinc-100 dark:bg-zinc-800">
                {asset.coverImage ? (
                  <Image
                    src={asset.coverImage}
                    alt={asset.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="size-12 text-muted-foreground opacity-20" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                  <div className="flex justify-end gap-2">
                    <Link href={`/gallery/${asset.slug}`}>
                      <Button
                        size="icon"
                        className="size-10 rounded-2xl bg-white text-zinc-950 hover:bg-primary hover:text-white shadow-xl"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                    <UploadMediaModal
                      asset={mapGalleryItemToAsset(asset)}
                      organizationId={orgId ?? undefined}
                      trigger={
                        <Button
                          size="icon"
                          className="size-10 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-900 hover:text-white shadow-xl"
                        >
                          <Edit3 className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="size-10 rounded-2xl shadow-xl"
                      onClick={() => setDeleteTarget(asset.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Badge
                      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase border-none ${asset.isPublished ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}
                    >
                        {asset.approvalStatus === "PENDING"
                          ? "Pending Admin review"
                          : asset.approvalStatus === "REJECTED"
                            ? "Rejected"
                            : "Approved"}
                    </Badge>
                    {asset.category && (
                      <Badge
                        className={`rounded-full px-3 py-1 text-[8px] font-black uppercase border-none ${catStyle(asset.category)}`}
                      >
                        {asset.category}
                      </Badge>
                    )}
                    <p className="text-white font-black text-sm tracking-tight leading-tight">
                      {asset.title}
                    </p>
                    <p className="text-white/60 text-[10px] font-bold uppercase">
                      {format(new Date(asset.createdAt), "MMM yyyy")} ·{" "}
                      {asset.images.length} photos
                    </p>
                  </div>
                </div>

                {/* Static category badge */}
                {asset.category && (
                  <div className="absolute top-4 left-4 group-hover:opacity-0 transition-opacity">
                    <Badge
                      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase border-none shadow-sm ${catStyle(asset.category)}`}
                    >
                      {asset.category}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="mt-3 px-1">
                <p className="font-black text-sm tracking-tight truncate">
                  {asset.title}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase">
                  {asset.images.length} photos · {asset.approvalStatus ?? "PENDING"}
                </p>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredAssets.length} assets
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
                This will permanently remove the gallery item and all associated
                media.
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
