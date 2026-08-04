"use client";

import { useState } from "react";
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
import { PenTool, Loader2, FileText } from "lucide-react";
import { useCreatePostMutation } from "@/redux/features/posts/postsApi";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be more descriptive"),
  postType: z.enum([
    "ANNOUNCEMENT",
    "URGENT",
    "EVENT",
    "EMERGENCY",
    "GENERAL",
    "RECAP",
    "DONATION",
    "HELP_REQUEST",
    "SOCIAL_ACTIVITY",
  ]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

const AdminPostModal = () => {
  const [open, setOpen] = useState(false);
  const [createPost, { isLoading }] = useCreatePostMutation();

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content:
        "This is a platform-wide post about system updates, organization news, or urgent blood supply notices...",
      postType: "ANNOUNCEMENT",
      visibility: "PUBLIC",
    },
  });

  const onSubmit = async (data: z.infer<typeof postSchema>) => {
    try {
      // createPost expects FormData per the API definition
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("postType", data.postType);
      formData.append("visibility", data.visibility);
      await createPost(formData).unwrap();
      toast.success("Post published to the feed");
      setOpen(false);
      form.reset();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to publish post");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all shrink-0">
          New Post <PenTool className="ml-2 size-4 text-emerald-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="size-8" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase ">
              Platform Bulletin
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              Create a new campaign post or platform announcement that will be
              visible to all members.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Post Headline
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="E.g., Quarterly Blood Summit"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                      Post Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        {[
                          { val: "ANNOUNCEMENT", label: "Announcement" },
                          { val: "URGENT", label: "Urgent Alert" },
                          { val: "EVENT", label: "Event Post" },
                          { val: "EMERGENCY", label: "Emergency" },
                          { val: "GENERAL", label: "General" },
                          { val: "RECAP", label: "Recap" },
                          { val: "DONATION", label: "Donation" },
                          { val: "HELP_REQUEST", label: "Help Request" },
                          { val: "SOCIAL_ACTIVITY", label: "Social Activity" },
                        ].map((t) => (
                          <SelectItem
                            key={t.val}
                            value={t.val}
                            className="rounded-xl font-bold text-xs uppercase  my-1"
                          >
                            {t.label}
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
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Visibility
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-border/40 p-2">
                      <SelectItem value="PUBLIC" className="font-bold">
                        🌍 Public
                      </SelectItem>
                      <SelectItem value="PRIVATE" className="font-bold">
                        🔒 Private
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Post Content
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[180px] rounded-2xl bg-zinc-50 border-border/40 font-medium p-4 resize-none leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
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
                disabled={isLoading}
                className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Publishing...
                  </span>
                ) : (
                  "Publish Post"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPostModal;
