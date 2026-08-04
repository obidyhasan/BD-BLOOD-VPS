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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2, BookOpen } from "lucide-react";
import {
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  type Policy,
} from "@/redux/features/policies/policiesApi";

const policySchema = z.object({
  category: z.enum(["SAFETY", "ADMIN", "DONOR", "PRIVACY"]),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  active: z.boolean().default(true),
});

interface UploadPolicyModalProps {
  policy?: Policy;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const UploadPolicyModal = ({
  policy,
  trigger,
  onSuccess,
}: UploadPolicyModalProps) => {
  const [open, setOpen] = useState(false);

  const [createPolicy, { isLoading: isCreating }] = useCreatePolicyMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();
  const isLoading = isCreating || isUpdating;

  const form = useForm<z.infer<typeof policySchema>>({
    // zod v4 + hookform resolver compatibility requires cast until @hookform/resolvers supports zod v4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(policySchema as any),
    defaultValues: {
      category: "SAFETY",
      title: "",
      description: "",
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category: policy?.category ?? "SAFETY",
        title: policy?.title ?? "",
        description: policy?.description ?? "",
        active: policy?.active ?? true,
      });
    }
  }, [open, policy, form]);

  const onSubmit = async (data: z.infer<typeof policySchema>) => {
    try {
      if (policy) {
        await updatePolicy({ id: policy.id, data }).unwrap();
        toast.success("Policy updated successfully");
      } else {
        await createPolicy(data).unwrap();
        toast.success("New policy published");
      }
      setOpen(false);
      onSuccess?.();
      form.reset();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Something went wrong. Please try again.");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-12 px-6 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all">
            Add Policy <Plus className="ml-2 size-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              {policy ? "Edit Policy" : "Add Policy"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              {policy
                ? "Update this organization's policy."
                : "Define a new policy for platform safety and operations."}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                      Governance Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="SAFETY" className="font-bold">
                          Safety & Health
                        </SelectItem>
                        <SelectItem value="ADMIN" className="font-bold">
                          Administrative
                        </SelectItem>
                        <SelectItem value="DONOR" className="font-bold">
                          Donor Relations
                        </SelectItem>
                        <SelectItem value="PRIVACY" className="font-bold">
                          Privacy & Security
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                      Initial Status
                    </FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "true")}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="true" className="font-bold">
                          Active Enforcement
                        </SelectItem>
                        <SelectItem value="false" className="font-bold">
                          Inactive / Draft
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Policy Title
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                      <Input
                        className="h-14 pl-12 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                        placeholder="E.g., Donor Verification"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                    Regulation Details
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="rounded-2xl bg-zinc-50 border-border/40 font-bold min-h-[120px] py-4"
                      placeholder="Clearly define the rules and expected behavior..."
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
                    <Loader2 className="size-4 animate-spin" /> Syncing...
                  </span>
                ) : policy ? (
                  "Update Policy"
                ) : (
                  "Publish Policy"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPolicyModal;
