import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import {
  useCreateGalleryMutation,
  useUpdateGalleryMutation,
} from "@/redux/features/gallery/galleryApi";
import type { GalleryAssetUI } from "@/lib/gallery";
import GalleryUpload from "@/components/ui/gallery-upload";

const uploadSchema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z.string().min(3, "Slug is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  img: z.string().min(1, "Image is required"),
});

interface UploadMediaModalProps {
  asset?: GalleryAssetUI;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  // Pass this when managing an Organization's own gallery (org dashboard).
  // Omit it entirely for the Admin/Homepage Gallery context — the created
  // item is then a Homepage Gallery item (no organizationId), which is
  // enforced server-side.
  organizationId?: string;
}

type CreateGalleryPayload = {
  title: string;
  slug: string;
  category: string;
  description?: string;
  coverImage: string;
  images: string[];
  organizationId?: string;
};

const UploadMediaModal = ({
  asset,
  trigger,
  onSuccess,
  organizationId,
}: UploadMediaModalProps) => {
  const [open, setOpen] = useState(false);
  const [createGallery, { isLoading: creating }] = useCreateGalleryMutation();
  const [updateGallery, { isLoading: updating }] = useUpdateGalleryMutation();
  const loading = creating || updating;

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      slug: "",
      category: "Event",
      description: "",
      img: "",
    },
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        title: asset.title,
        slug: asset.slug,
        category: asset.category,
        description: asset.description || "",
        img: asset.img,
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        category: "Event",
        description: "",
        img: "",
      });
    }
  }, [asset, form, open]);

  const initialFiles = useMemo(() => {
    if (asset?.img) {
      return [
        {
          id: asset.id,
          name: asset.title || "Current Image",
          size: 0,
          type: "image/*",
          url: asset.img,
        },
      ];
    }
    return [];
  }, [asset]);

  const onSubmit = async (data: z.infer<typeof uploadSchema>) => {
    try {
      if (asset) {
        await updateGallery({
          id: asset.id,
          data: {
            title: data.title,
            slug: data.slug,
            category: data.category,
            description: data.description,
            coverImage: data.img,
            images: data.img ? [data.img] : [],
          },
        }).unwrap();
        toast.success("Media updated successfully");
      } else {
        const payload: CreateGalleryPayload = {
          title: data.title,
          slug: data.slug,
          category: data.category,
          description: data.description,
          coverImage: data.img,
          images: data.img ? [data.img] : [],
          organizationId,
        };

        await createGallery(payload).unwrap();
        toast.success("Media uploaded successfully");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch {
      toast.error("Failed to process the file");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Upload Media <Upload className="ml-2 size-4 text-emerald-500" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {asset ? "Edit Media" : "Create Media"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              {asset
                ? "Update the details of this photo."
                : "Upload a new photo or banner to the platform's visual gallery."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
          >
            <FormField
              control={form.control}
              name="img"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Visual Content
                  </FormLabel>
                  <FormControl>
                    <GalleryUpload
                      maxFiles={1}
                      multiple={false}
                      initialFiles={initialFiles}
                      onFilesChange={(files) => {
                        if (files.length > 0 && files[0].preview) {
                          field.onChange(files[0].preview);
                        } else {
                          field.onChange("");
                        }
                      }}
                      className="max-w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Asset Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., Training Camp 2026"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!asset) {
                          form.setValue("slug", generateSlug(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1 ">
                      Asset Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {[
                          "Event",
                          "Blood Drive",
                          "Medical",
                          "Volunteer",
                          "Campaign",
                          "Training",
                          "Other",
                        ].map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="rounded-xl font-bold text-xs uppercase  my-1"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      URL Slug
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="training-camp-2026"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[100px]"
                      placeholder="Enter a brief description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : asset ? (
                  "Update Photo"
                ) : (
                  "Process Upload"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMediaModal;
