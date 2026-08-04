"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, Plus, Loader2 } from "lucide-react";
import { useCreatePolicyMutation } from "@/redux/features/policies/policiesApi";
import { mapCategoryLabelToApi } from "@/lib/policy";

const policySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

const PolicyModal = () => {
  const [open, setOpen] = useState(false);
  const [createPolicy, { isLoading: loading }] = useCreatePolicyMutation();

  const form = useForm<z.infer<typeof policySchema>>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      title: "",
      category: "Admin",
      description: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof policySchema>) => {
    try {
      const category = mapCategoryLabelToApi(data.category);
      if (!category) {
        toast.error("Invalid category");
        return;
      }
      await createPolicy({
        title: data.title,
        category,
        description: data.description,
        active: true,
      }).unwrap();
      toast.success("New policy created and activated");
      setOpen(false);
      form.reset();
    } catch {
      toast.error("Failed to draft policy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all shrink-0">
          Draft Policy <Plus className="ml-2 size-4 text-emerald-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-10 sm:max-w-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="size-8" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase ">
              Draft Governance Policy
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  mt-1">
              Introduce a new platform-wide rule that will be enforced across all hubs and organization dashboards.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Policy Name</FormLabel>
                    <FormControl>
                      <Input className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold" placeholder="E.g., Donor Age Restriction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Policy Domain</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/40 p-2">
                        {["Safety", "Admin", "Donor", "Privacy"].map((cat) => (
                          <SelectItem key={cat} value={cat} className="rounded-xl font-bold text-xs uppercase  my-1">{cat}</SelectItem>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">Enforcement Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[140px] rounded-2xl bg-zinc-50 border-border/40 font-medium p-4 resize-none leading-relaxed"
                      placeholder="Describe what this policy enforces and why it is required..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/10">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading} className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Activating...
                  </span>
                ) : "Create Policy"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyModal;
