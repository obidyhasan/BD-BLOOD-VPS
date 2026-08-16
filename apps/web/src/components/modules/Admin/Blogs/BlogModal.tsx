"use client";

import { useState, useEffect } from "react";
import { extractErrorMessage } from "@/lib/apiError";
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
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  type BlogType,
} from "@/redux/features/blogs/blogsApi";
import GalleryUpload from "@/components/ui/gallery-upload";

const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(50, "Article content must be more substantial"),
  coverImage: z.string().min(1, "Cover image is required"),
});

type BlogModalProps = {
  blog?: BlogType;
  organizationId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

const BlogModal = ({
  blog,
  organizationId,
  trigger,
  onSuccess,
}: BlogModalProps) => {
  const [open, setOpen] = useState(false);

  const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<z.infer<typeof blogSchema>>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: blog?.title ?? "",
      content: blog?.content ?? "",
      coverImage: blog?.coverImage ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: blog?.title ?? "",
        content: blog?.content ?? "",
        coverImage: blog?.coverImage ?? "",
      });
    }
  }, [open, blog, form]);

  const onSubmit = async (data: z.infer<typeof blogSchema>) => {
    try {
      if (blog) {
        await updateBlog({
          id: blog.id,
          data: {
            title: data.title,
            content: data.content,
            coverImage: data.coverImage,
          },
        }).unwrap();
        toast.success("Article updated successfully");
      } else {
        await createBlog({
          title: data.title,
          content: data.content,
          coverImage: data.coverImage,
          organizationId,
        }).unwrap();
        toast.success(
          organizationId
            ? "Article submitted for Admin approval"
            : "New blog article created",
        );
      }
      onSuccess?.();
      setOpen(false);
      form.reset();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to save article");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase hover:bg-zinc-900 shadow-xl transition-all shrink-0"
          >
            {blog ? (
              "Edit"
            ) : (
              <>
                New Article <Plus className="ml-2 size-4 text-emerald-500" />
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <DialogHeader className="space-y-4">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {blog ? "Update Blog" : "Create Blog"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {blog
                ? `Editing: ${blog.title}`
                : "Create a new story, guide, or announcement for the platform's blog."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 relative z-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                        Article Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                          placeholder="E.g., World Blood Donor Day"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Author is set automatically server-side from the authenticated user */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40">
                  <p className="text-[10px] font-black uppercase text-muted-foreground ">
                    Author
                  </p>
                  <p className="text-sm font-bold mt-1 opacity-60">
                    Set automatically from your account
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1 flex items-center gap-2">
                      <ImageIcon className="size-3" /> Cover Image
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <GalleryUpload
                          maxFiles={1}
                          multiple={false}
                          onFilesChange={(files) => {
                            if (files.length > 0 && files[0].preview) {
                              field.onChange(files[0].preview);
                            }
                          }}
                        />
                        {field.value && (
                          <p className="text-[9px] font-bold text-emerald-500 uppercase overflow-hidden truncate max-w-full">
                            Image Selected: {field.value.substring(0, 40)}...
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Article Content Body
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[150px] rounded-3xl bg-zinc-50 border-border/40 font-medium p-6 resize-none leading-relaxed text-base"
                      placeholder="Start writing your health guide or story here..."
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
                  className="h-12 rounded-2xl font-black text-xs uppercase border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded-2xl font-black text-xs uppercase bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : blog ? (
                  "Save Changes"
                ) : (
                  "Publish to Blog"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogModal;
