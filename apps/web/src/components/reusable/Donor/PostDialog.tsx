"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import GalleryUpload from "@/components/ui/gallery-upload";
import { ImageIcon, Send } from "lucide-react";
import type { LegacyPost } from "@/lib/post";
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload";
import {
  useCreatePostMutation,
  useGetPostEligibilityQuery,
  useUpdatePostMutation,
  type Post as ApiPost,
} from "@/redux/features/posts/postsApi";
import { useGetMyMembershipQuery } from "@/redux/features/organizations/organizationsApi";

interface PostDialogProps {
  post?: LegacyPost;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  donationOnly?: boolean;
}

function buildFormData(
  fields: {
    title: string;
    content: string;
    postType: ApiPost["postType"];
    visibility: ApiPost["visibility"];
    organizationId?: string;
    donationId?: string;
  },
  galleryFiles: FileWithPreview[],
) {
  const formData = new FormData();
  formData.append("title", fields.title);
  formData.append("content", fields.content);
  formData.append("postType", fields.postType);
  formData.append("visibility", fields.visibility);
  if (fields.organizationId) {
    formData.append("organizationId", fields.organizationId);
  }
  if (fields.donationId) {
    formData.append("donationId", fields.donationId);
  }

  galleryFiles.forEach((item) => {
    if (item.file instanceof File) {
      formData.append("files", item.file);
    } else if ("url" in item.file && item.file.url.startsWith("http")) {
      formData.append("images", item.file.url);
    }
  });

  return formData;
}

export function PostDialog({
  post,
  open,
  onOpenChange,
  trigger,
  donationOnly = false,
}: PostDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<LegacyPost["type"]>(
    donationOnly ? "RECAP" : "GENERAL",
  );
  const [visibility, setVisibility] =
    useState<LegacyPost["visibility"]>("Public");
  const [galleryFiles, setGalleryFiles] = useState<FileWithPreview[]>([]);
  const [donationId, setDonationId] = useState("");

  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const { data: eligibilityData } = useGetPostEligibilityQuery();
  const [updatePost, { isLoading: updating }] = useUpdatePostMutation();
  const { data: membershipData } = useGetMyMembershipQuery();

  const initialFiles: FileMetadata[] = useMemo(
    () =>
      (post?.images ?? []).map((url, i) => ({
        id: `existing-${i}`,
        name: `image-${i + 1}`,
        size: 0,
        type: "image/*",
        url,
      })),
    [post?.images],
  );

  const resetFormState = () => {
    if (post) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setType(post.type || "GENERAL");
      setVisibility(post.visibility || "Public");
      setGalleryFiles(
        (post.images ?? []).map((url, i) => ({
          id: `existing-${i}`,
          file: {
            id: `existing-${i}`,
            name: `image-${i + 1}`,
            size: 0,
            type: "image/*",
            url,
          },
          preview: url,
        })),
      );
    } else {
      setTitle("");
      setContent("");
      setType(donationOnly ? "RECAP" : "GENERAL");
      setVisibility("Public");
      setGalleryFiles([]);
      setDonationId("");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetFormState();
    }
    setOpen(nextOpen);
  };

  const personalDonationPost = type === "RECAP";
  const eligibleDonations = eligibilityData?.data ?? [];

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        toast.error("Please enter a title for your post.");
        return;
      }
      if (!content.trim()) {
        toast.error("Please enter a description for your post.");
        return;
      }

      if (!post && personalDonationPost && !donationId) {
        toast.error("Select an unused verified donation for this recap.");
        return;
      }

      const orgId = membershipData?.data?.organizationId;
      const payload = {
        title,
        content,
        postType: type as ApiPost["postType"],
        visibility: (visibility === "Public"
          ? "PUBLIC"
          : "PRIVATE") as ApiPost["visibility"],
        organizationId: orgId ?? undefined,
        donationId: personalDonationPost ? donationId : undefined,
      };

      if (post) {
        await updatePost({
          id: post.id,
          data: buildFormData(payload, galleryFiles),
        }).unwrap();
        toast.success("Post updated!");
      } else {
        await createPost(buildFormData(payload, galleryFiles)).unwrap();
        toast.success("Post submitted for review!");
      }
      setOpen(false);
    } catch {
      toast.error("An error occurred. Please try again.");
    }
  };

  const isSubmitting = creating || updating;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl rounded-[3rem] p-0 border-border/40 shadow-premium overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

        <div className="p-6 md:p-8 relative">
          <DialogHeader className="mb-10 space-y-4 text-left">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">
                {post ? "Update" : "Create"}{" "}
                <span className="text-primary">Post</span>
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-muted-foreground leading-relaxed max-w-lg mt-3">
                {post
                  ? "Update your post to keep the information accurate."
                  : donationOnly
                    ? "Share a story linked to one of your verified donations."
                    : "Share important alerts or updates with the community."}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="no-scrollbar max-h-[60vh] overflow-y-auto pr-2 pl-2 -mr-2 space-y-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground  px-1">
                  Subject
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post heading"
                  className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-bold"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground  px-1">
                  Description
                </Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write details here..."
                  className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 min-h-[140px] p-6 text-sm font-bold leading-relaxed focus-visible:ring-primary/20 resize-none"
                />
              </div>

              {!post && personalDonationPost && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground px-1">
                    Verified Donation
                  </Label>
                  <Select value={donationId} onValueChange={setDonationId}>
                    <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs">
                      <SelectValue placeholder="Select an unused verified donation" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {eligibleDonations.map((donation) => (
                        <SelectItem key={donation.id} value={donation.id}>
                          {new Date(donation.donationDate).toLocaleDateString()} · {donation.hospitalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {eligibleDonations.length === 0 && (
                    <p className="text-xs font-bold text-amber-600">
                      No unused verified donation is available for a recap post.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!donationOnly && <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground  px-1">
                    Category
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(val) => setType(val as LegacyPost["type"])}
                  >
                    <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {[
                        { label: "Urgent", value: "URGENT" },
                        { label: "Emergency", value: "EMERGENCY" },
                        { label: "Event", value: "EVENT" },
                        { label: "Alert", value: "ANNOUNCEMENT" },
                        { label: "General", value: "GENERAL" },
                        { label: "Report", value: "RECAP" },
                      ].map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-xs font-black uppercase"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>}

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground  px-1">
                    Visibility
                  </Label>
                  <Select
                    value={visibility}
                    onValueChange={(val) =>
                      setVisibility(val as LegacyPost["visibility"])
                    }
                  >
                    <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold text-xs uppercase">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem
                        value="Public"
                        className="text-xs font-black uppercase"
                      >
                        Public
                      </SelectItem>
                      <SelectItem
                        value="Private"
                        className="text-xs font-black uppercase"
                      >
                        Hidden
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground  px-1 flex items-center gap-2">
                  <ImageIcon className="size-3 text-primary" />
                  Gallery
                </Label>
                <div className="min-h-[200px] rounded-[2.5rem] border border-dashed border-border/60 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 group hover:border-primary/40 transition-colors">
                  <GalleryUpload
                    key={post?.id ?? "new"}
                    maxFiles={5}
                    className="w-full space-y-4"
                    initialFiles={initialFiles}
                    onFilesChange={setGalleryFiles}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-14 px-12 rounded-2xl font-black text-xs uppercase  bg-primary text-white hover:bg-emerald-600 shadow-xl shadow-primary/20 border-none transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
              >
                {post ? "Submit Changes" : "Submit Post"}
                <Send className="size-3.5 fill-white" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
