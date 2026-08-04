"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Upload } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import GalleryUpload from "@/components/ui/gallery-upload";
import {
  useGetAllInstitutionsQuery,
  useCreateAdMutation,
  useUpdateAdMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapInstitutionToUI, type AdUI } from "@/lib/medical";

const adSchema = z.object({
  medicalId: z.string().min(1, "Medical partner is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  bannerImage: z.string().min(1, "Banner image is required"),
  ctaText: z.string().min(2, "CTA text is required"),
  status: z.enum(["Active", "Paused"]),
});

export interface UploadAdModalProps {
  ad?: AdUI;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function UploadAdModal({
  ad,
  trigger,
  onSuccess,
}: UploadAdModalProps) {
  const [open, setOpen] = useState(false);
  const [createAd, { isLoading: creating }] = useCreateAdMutation();
  const [updateAd, { isLoading: updating }] = useUpdateAdMutation();
  const loading = creating || updating;
  const { data: institutionsData } = useGetAllInstitutionsQuery(
    { limit: 200 },
    { skip: !open },
  );
  const institutions = useMemo(
    () => (institutionsData?.data ?? []).map(mapInstitutionToUI),
    [institutionsData],
  );

  const form = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      medicalId: "",
      title: "",
      description: "",
      bannerImage: "",
      ctaText: "Learn More",
      status: "Active",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      medicalId: ad?.medicalId ?? "",
      title: ad?.title ?? "",
      description: ad?.description ?? "",
      bannerImage: ad?.bannerImage ?? "",
      ctaText: ad?.ctaText ?? "Learn More",
      status: ad?.status ?? "Active",
    });
  }, [open, ad, form]);

  const initialFiles = useMemo(() => {
    if (!ad?.bannerImage) return [];
    return [
      {
        id: ad.id,
        name: ad.title || "Current Banner",
        size: 0,
        type: "image/*",
        url: ad.bannerImage,
      },
    ];
  }, [ad]);

  const onSubmit = async (data: z.infer<typeof adSchema>) => {
    try {
      const inst = institutions.find((i) => i.id === data.medicalId);
      if (!inst) {
        toast.error("Invalid medical partner selection");
        return;
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 90);

      const payload = {
        institutionId: inst.id,
        title: data.title,
        imageUrl: data.bannerImage,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        status: (data.status === "Active" ? "ACTIVE" : "INACTIVE") as
          | "ACTIVE"
          | "INACTIVE",
      };

      if (ad) {
        await updateAd({ id: ad.id, data: payload }).unwrap();
        toast.success("Ad updated successfully");
      } else {
        await createAd(payload).unwrap();
        toast.success("Ad created successfully");
      }

      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch {
      toast.error("Failed to process ad");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Create Ad <Plus className="ml-2 size-4 text-emerald-500" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {ad ? "Edit Ad" : "Create Ad"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {ad
                ? "Update this promotional campaign."
                : "Create a new promotional banner for a medical partner."}
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
              name="bannerImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Banner Image
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="medicalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Medical Partner
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {institutions.map((i) => (
                          <SelectItem
                            key={i.id}
                            value={i.id}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {i.name}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Status
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {["Active", "Paused"].map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., 24/7 Expert Support"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[110px]"
                      placeholder="Write a short, clear campaign description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ctaText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    CTA Text
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., View Packages"
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
                  className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <>
                    {ad ? "Update Ad" : "Create Ad"}{" "}
                    <Upload className="ml-2 size-4 text-white/80" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
