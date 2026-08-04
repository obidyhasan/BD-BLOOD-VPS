"use client";

import { extractErrorMessage } from "@/lib/apiError";
import { useEffect, useState } from "react";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { HelpCircle, Loader2, Plus } from "lucide-react";
import {
  useCreateFaqMutation,
  useUpdateFaqMutation,
  type Faq,
} from "@/redux/features/faqs/faqsApi";

const faqSchema = z.object({
  question: z.string().min(3, "Question is required"),
  answer: z.string().min(3, "Answer is required"),
  category: z.string().optional(),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

type FaqFormValues = z.infer<typeof faqSchema>;

interface FaqModalProps {
  faq?: Faq;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const FaqModal = ({ faq, trigger, onSuccess }: FaqModalProps) => {
  const [open, setOpen] = useState(false);
  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<FaqFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(faqSchema as any),
    defaultValues: {
      question: "",
      answer: "",
      category: "General",
      active: true,
      order: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        question: faq?.question ?? "",
        answer: faq?.answer ?? "",
        category: faq?.category ?? "General",
        active: faq?.active ?? true,
        order: faq?.order ?? 0,
      });
    }
  }, [open, faq, form]);

  const onSubmit = async (data: FaqFormValues) => {
    const payload = {
      ...data,
      category: data.category?.trim() || undefined,
    };

    try {
      if (faq) {
        await updateFaq({ id: faq.id, data: payload }).unwrap();
        toast.success("FAQ updated successfully");
      } else {
        await createFaq(payload).unwrap();
        toast.success("FAQ published successfully");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to save FAQ"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Add FAQ <Plus className="ml-2 size-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-xl">
        <DialogHeader className="space-y-4 mb-8">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {faq ? "Edit FAQ" : "Add FAQ"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              Manage questions shown in the homepage FAQ section.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Category
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="General"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Sort Order
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Status
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="true" className="font-bold">
                          Active
                        </SelectItem>
                        <SelectItem value="false" className="font-bold">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Question
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                      <Input
                        className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="E.g., How can I request blood?"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Answer
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[140px] py-4"
                      placeholder="Write a clear answer for visitors..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4 pt-4">
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
                disabled={isLoading}
                className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Saving...
                  </span>
                ) : faq ? (
                  "Update FAQ"
                ) : (
                  "Publish FAQ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FaqModal;
